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
  
  final SmsQuery _query = SmsQuery();
  List<dynamic> _transactions = [];
  bool _isLoading = false;
  String _statusMessage = "Initializing...";

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  /// Load the saved IP address from storage
  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _backendUrl = prefs.getString('backend_url') ?? _backendUrl;
      _statusMessage = "Connected to: $_backendUrl";
    });
    _fetchTransactions();
  }

  /// Save the new IP address
  Future<void> _saveSettings(String newUrl) async {
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
    
    setState(() {
      _backendUrl = newUrl;
      _statusMessage = "Updated Server: $_backendUrl";
    });
    _fetchTransactions();
  }

  /// Dialog to let user change IP
  void _showSettingsDialog() {
    TextEditingController controller = TextEditingController(text: _backendUrl);
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
                controller: controller,
                decoration: const InputDecoration(
                  hintText: "http://192.168.1.5:8000",
                  border: OutlineInputBorder(),
                ),
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
                _saveSettings(controller.text);
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
      final response = await http.get(Uri.parse('$_backendUrl/transactions'));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _transactions = data['transactions'];
          _transactions = _transactions.reversed.toList();
          _statusMessage = "Loaded ${data['count']} transactions.";
        });
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
      List<SmsMessage> messages = await _query.querySms(
        kinds: [SmsQueryKind.inbox],
        count: 500,
      );

      List<SmsMessage> bankingMessages = messages.where((msg) {
        final body = (msg.body ?? "").toLowerCase();
        bool hasKeywords = body.contains("rs.") || 
                           body.contains("inr") || 
                           body.contains("credited") || 
                           body.contains("debited") ||
                           body.contains("a/c");
        return hasKeywords;
      }).toList();

      setState(() => _statusMessage = "Uploading ${bankingMessages.length} SMS to $_backendUrl...");

      int successCount = 0;
      for (var msg in bankingMessages) {
        if (msg.body == null) continue;

        try {
          // Convert timestamp to ISO8601 format as expected by backend
          final timestamp = msg.date != null 
              ? DateTime.fromMillisecondsSinceEpoch(msg.date!.millisecondsSinceEpoch)
              : DateTime.now();
          
          final payload = json.encode({
            "raw_text": msg.body!,  // Changed from "body" to match backend schema
            "timestamp": timestamp.toIso8601String(),  // ISO8601 format
            "source": "SMS_LISTENER",  // Added required field
            "sender": msg.sender ?? "UNKNOWN",
          });

          final response = await http.post(
            Uri.parse('$_backendUrl/ingest-message'),  // Changed from /process-sms
            headers: {"Content-Type": "application/json"},
            body: payload,
          );

          if (response.statusCode == 200) {
            successCount++;
          }
        } catch (e) {
          print("Failed to upload msg: $e");
        }
      }

      setState(() => _statusMessage = "Synced! Processed $successCount messages.");
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
