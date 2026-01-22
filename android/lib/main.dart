import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_sms_inbox/flutter_sms_inbox.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Bank SMS Tracker',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const MyHomePage(title: 'My Expenses'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  // Default fallback - Android emulator localhost (can be changed in settings)
  String _backendUrl = 'http://10.0.2.2:8000';
  String _apiKey = 'dev-api-key-change-in-production';  // API key for authentication
  
  final SmsQuery _query = SmsQuery();
  List<dynamic> _transactions = [];
  bool _isLoading = false;
  String _statusMessage = "Initializing...";
  
  // Valid bank sender IDs for filtering
  final List<String> _validBankSenders = [
    'HDFCBK', 'SBI', 'SBIN', 'ICICI', 'AXIS', 'KOTAK', 
    'PAYTM', 'YESBNK', 'INDUSIND', 'PNBSMS', 'BOI', 'CANBNK'
  ];

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  /// Load the saved IP address and API key from storage
  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _backendUrl = prefs.getString('backend_url') ?? _backendUrl;
      _apiKey = prefs.getString('api_key') ?? _apiKey;
      _statusMessage = "Connected to: $_backendUrl";
    });
    _fetchTransactions();
  }

  /// Save the new IP address and API key
  Future<void> _saveSettings(String newUrl, String newApiKey) async {
    // Basic validation to ensure it starts with http
    if (!newUrl.startsWith("http")) {
      newUrl = "http://$newUrl";
    }
    // Remove trailing slash if present
    if (newUrl.endsWith("/")) {
      newUrl = newUrl.substring(0, newUrl.length - 1);
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('backend_url', newUrl);
    await prefs.setString('api_key', newApiKey);
    
    setState(() {
      _backendUrl = newUrl;
      _apiKey = newApiKey;
      _statusMessage = "Updated Server: $_backendUrl";
    });
    _fetchTransactions();
  }

  /// Dialog to let user change IP and API key
  void _showSettingsDialog() {
    TextEditingController urlController = TextEditingController(text: _backendUrl);
    TextEditingController apiKeyController = TextEditingController(text: _apiKey);
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text("Server Configuration"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text("Enter your Laptop's IP Address and Port:"),
              const SizedBox(height: 10),
              TextField(
                controller: urlController,
                decoration: const InputDecoration(
                  hintText: "http://192.168.1.5:8000",
                  border: OutlineInputBorder(),
                  labelText: "Server URL",
                ),
              ),
              const SizedBox(height: 15),
              TextField(
                controller: apiKeyController,
                decoration: const InputDecoration(
                  hintText: "dev-api-key-change-in-production",
                  border: OutlineInputBorder(),
                  labelText: "API Key",
                ),
                obscureText: true,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () {
                _saveSettings(urlController.text, apiKeyController.text);
                Navigator.pop(context);
              },
              child: const Text("Save"),
            ),
          ],
        );
      },
    );
  }

  Future<void> _fetchTransactions() async {
    setState(() => _isLoading = true);
    try {
      final response = await http.get(
        Uri.parse('$_backendUrl/transactions'),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $_apiKey",  // Add authentication
        },
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _transactions = data['transactions'];
          _transactions = _transactions.reversed.toList();
          _statusMessage = "Loaded ${data['count']} transactions.";
        });
      } else if (response.statusCode == 401) {
        setState(() => _statusMessage = "Authentication Failed: Check API Key");
      } else {
        setState(() => _statusMessage = "Server Error: ${response.statusCode}");
      }
    } catch (e) {
      setState(() => _statusMessage = "Connection Failed: $_backendUrl");
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _syncSMS() async {
    var permission = await Permission.sms.status;
    if (permission.isDenied) {
      permission = await Permission.sms.request();
    }
    
    if (!permission.isGranted) {
      setState(() => _statusMessage = "SMS Permission Denied");
      return;
    }

    setState(() {
      _isLoading = true;
      _statusMessage = "Reading SMS Inbox...";
    });

    try {
      // Load last sync timestamp
      final prefs = await SharedPreferences.getInstance();
      int? lastSyncTime = prefs.getInt('last_sync_timestamp');
      
      // Query only new messages since last sync (or last 30 days if first sync)
      List<SmsMessage> messages = await _query.querySms(
        kinds: [SmsQueryKind.inbox],
        start: lastSyncTime != null 
            ? DateTime.fromMillisecondsSinceEpoch(lastSyncTime)
            : DateTime.now().subtract(const Duration(days: 30)),
      );

      // Filter for banking messages with sender validation
      List<SmsMessage> bankingMessages = messages.where((msg) {
        final body = (msg.body ?? "").toLowerCase();
        final sender = (msg.sender ?? "").toUpperCase();
        
        // Check for transaction keywords
        bool hasKeywords = body.contains("rs.") || 
                           body.contains("inr") || 
                           body.contains("credited") || 
                           body.contains("debited") ||
                           body.contains("a/c");
        
        // Check if sender is from a known bank
        bool isFromBank = _validBankSenders.any((bank) => sender.contains(bank));
        
        return hasKeywords && isFromBank;  // Both conditions must be true
      }).toList();

      setState(() => _statusMessage = "Uploading ${bankingMessages.length} new SMS...");

      int successCount = 0;
      int failedCount = 0;
      for (var msg in bankingMessages) {
        if (msg.body == null) continue;

        try {
          // Convert timestamp to ISO8601 format as expected by backend
          final timestamp = msg.date != null 
              ? DateTime.fromMillisecondsSinceEpoch(msg.date!.millisecondsSinceEpoch)
              : DateTime.now();
          
          final payload = json.encode({
            "raw_text": msg.body!,
            "timestamp": timestamp.toIso8601String(),
            "source": "SMS_LISTENER",
            "sender": msg.sender ?? "UNKNOWN",
          });

          final response = await http.post(
            Uri.parse('$_backendUrl/ingest-message'),
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer $_apiKey",  // Add authentication
            },
            body: payload,
          );

          if (response.statusCode == 200 || response.statusCode == 204) {
            successCount++;
          } else if (response.statusCode == 401) {
            setState(() => _statusMessage = "Authentication Failed: Check API Key");
            return;  // Stop syncing if authentication fails
          } else {
            failedCount++;
          }
        } catch (e) {
          failedCount++;
          print("Failed to upload msg: $e");
        }
      }

      // Save sync timestamp after successful upload
      if (successCount > 0) {
        await prefs.setInt('last_sync_timestamp', DateTime.now().millisecondsSinceEpoch);
      }

      setState(() => _statusMessage = "Synced! ✓ $successCount uploaded${failedCount > 0 ? ', ✗ $failedCount failed' : ''}");
      _fetchTransactions();

    } catch (e) {
      setState(() => _statusMessage = "Sync Error: $e");
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: _showSettingsDialog,
            tooltip: "Server Settings",
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchTransactions,
            tooltip: "Refresh Data",
          )
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.grey[200],
            width: double.infinity,
            child: Text(
              _statusMessage,
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          
          if (_isLoading) const LinearProgressIndicator(),

          Expanded(
            child: _transactions.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.cloud_off, size: 64, color: Colors.grey),
                        const SizedBox(height: 10),
                        const Text("No transactions found."),
                        const SizedBox(height: 5),
                        Text(
                          "Check Server IP in Settings (Top Right)",
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    itemCount: _transactions.length,
                    itemBuilder: (context, index) {
                      final txn = _transactions[index];
                      final isIncome = txn['Type'] == "Income";
                      
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: isIncome ? Colors.green[100] : Colors.red[100],
                            child: Icon(
                              isIncome ? Icons.arrow_downward : Icons.arrow_upward,
                              color: isIncome ? Colors.green : Colors.red,
                            ),
                          ),
                          title: Text(
                            txn['Recipient'] ?? "Unknown",
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Text("${txn['Date']} • ${txn['User_Bank']}"),
                          trailing: Text(
                            "${isIncome ? '+' : '-'} ₹${txn['Amount']}",
                            style: TextStyle(
                              color: isIncome ? Colors.green : Colors.red,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _isLoading ? null : _syncSMS,
        tooltip: 'Sync SMS',
        icon: const Icon(Icons.sync),
        label: const Text("Sync SMS"),
      ),
    );
  }
}
