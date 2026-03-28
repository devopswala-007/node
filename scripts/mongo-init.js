// MongoDB initialization script
// Runs once when the container is first created

db = db.getSiblingDB('taskflow');

db.createCollection('users');
db.createCollection('tasks');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.tasks.createIndex({ createdBy: 1, status: 1 });
db.tasks.createIndex({ dueDate: 1 });

print('✅ MongoDB initialized: taskflow database ready');
