from app import app, notify_ticket_answered, fetch_one, execute, log_activity
import os

# Create a test ticket for the student user
student_user_id = 11

with app.test_request_context():
    print("--- Simulating Ticket Resolution ---")
    
    # 1. Create a new ticket
    cur = execute(
        "INSERT INTO tickets (raised_by_user_id, raised_by_name, raised_by_role, subject, status) "
        "VALUES (?, ?, ?, ?, ?)",
        (student_user_id, "Test Student", "student", "Verification Ticket", "Open")
    )
    ticket_id = cur.lastrowid
    print(f"Created ticket #{ticket_id}")

    # 2. Get 'before' state
    before = fetch_one("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
    
    # 3. Resolve the ticket
    execute(
        "UPDATE tickets SET status = ?, response = ?, updated_at = datetime('now') WHERE id = ?",
        ("Resolved", "This ticket is now resolved by the agent.", ticket_id)
    )
    print(f"Updated ticket #{ticket_id} to Resolved")

    # 4. Get 'after' state
    after = fetch_one("SELECT * FROM tickets WHERE id = ?", (ticket_id,))

    # 5. Trigger notification
    print("Triggering notification...")
    notify_ticket_answered(ticket_id, before, after)
    
    # 6. Check activity logs
    log = fetch_one("SELECT * FROM activity_logs WHERE entity_id = ? AND action = 'email_sent' ORDER BY id DESC", (ticket_id,))
    if log:
        print(f"SUCCESS: Activity log found: {log['summary']}")
    else:
        print("FAILURE: No activity log found for email_sent")

    # 7. Check outbox
    outbox_path = os.path.join(app.instance_path, "email_outbox.log")
    if os.path.exists(outbox_path):
        with open(outbox_path, "r", encoding="utf-8") as f:
            content = f.read()
            if f"Your ticket #{ticket_id} has been updated" in content:
                print("SUCCESS: Email found in email_outbox.log")
            else:
                print("FAILURE: Email NOT found in email_outbox.log")
    else:
        print("Outbox log doesn't exist yet.")
