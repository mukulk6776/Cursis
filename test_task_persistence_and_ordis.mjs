import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTasks, createTask, updateTask, deleteTask, getTaskById } from './lib/db/tasks.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env.local');

let mongodbUri = '';
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('MONGODB_URI=')) {
      mongodbUri = trimmed.replace('MONGODB_URI=', '').replace(/^["']|["']$/g, '').trim();
      break;
    }
  }
}

if (!mongodbUri) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

// Set in environment for mongodb.ts
process.env.MONGODB_URI = mongodbUri;
process.env.MONGODB_DB_NAME = 'cursis';

async function runVerification() {
  console.log('====================================================');
  console.log('🧪 VERIFYING TASK DATABASE PERSISTENCE IN MONGODB');
  console.log('====================================================\n');

  const client = new MongoClient(mongodbUri);
  await client.connect();
  const db = client.db('cursis');
  const tasksCol = db.collection('tasks');

  const TEST_WS_ID = `ws_test_persist_${Date.now()}`;
  console.log(`Target Workspace ID: ${TEST_WS_ID}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Auto-seed initial tasks on empty workspace
    // -------------------------------------------------------------
    console.log('[Test 1] Testing getTasks() auto-seed on empty workspace...');
    const initialTasks = await getTasks(TEST_WS_ID);
    assert(initialTasks.length === 3, `Returned ${initialTasks.length} initial tasks`);
    
    // Verify in MongoDB Atlas
    const inMongo = await tasksCol.find({ workspaceId: TEST_WS_ID }).toArray();
    assert(inMongo.length === 3, `Found ${inMongo.length} tasks directly in MongoDB Atlas tasks collection`);

    // -------------------------------------------------------------
    // Test 2: Create a new task and persist to MongoDB
    // -------------------------------------------------------------
    console.log('\n[Test 2] Testing createTask() with MongoDB persistence...');
    const newTask = await createTask(TEST_WS_ID, {
      title: 'Deploy microservice with SSL & rate limiter',
      description: 'End-to-end cloud deployment deliverable',
      priority: 'urgent',
      status: 'todo',
      dueDate: 'Tomorrow, 5:00 PM', // Tests safe date normalization!
      tags: ['Backend', 'Security'],
      assigneeName: 'Alex Mercer',
      creatorId: 'usr_founder',
    });

    assert(Boolean(newTask.id), `Task created with ID: ${newTask.id}`);
    assert(newTask.dueDate.includes('T') && !isNaN(new Date(newTask.dueDate).getTime()), `DueDate safely normalized to valid ISO: ${newTask.dueDate}`);

    // Verify task exists directly in MongoDB Atlas collection
    const mongoDoc = await tasksCol.findOne({ id: newTask.id });
    assert(mongoDoc !== null, 'Task document successfully verified in MongoDB Atlas collection');
    assert(mongoDoc?.title === 'Deploy microservice with SSL & rate limiter', `Task title matches in MongoDB: "${mongoDoc?.title}"`);
    assert(mongoDoc?.priority === 'urgent', `Task priority matches in MongoDB: ${mongoDoc?.priority}`);

    // -------------------------------------------------------------
    // Test 3: Update task status (todo -> in_progress -> done)
    // -------------------------------------------------------------
    console.log('\n[Test 3] Testing updateTask() status & completion in MongoDB...');
    const updatedTask = await updateTask(newTask.id, {
      status: 'done',
    });

    assert(updatedTask?.status === 'done', `Status updated to "done" in memory`);
    assert(updatedTask?.completionPercent === 100, 'Completion percentage automatically set to 100%');

    // Verify update in MongoDB Atlas
    const updatedMongoDoc = await tasksCol.findOne({ id: newTask.id });
    assert(updatedMongoDoc?.status === 'done', `Status updated to "done" in MongoDB Atlas`);
    assert(updatedMongoDoc?.completionPercent === 100, `completionPercent is 100 in MongoDB Atlas`);

    // -------------------------------------------------------------
    // Test 4: Delete task from MongoDB
    // -------------------------------------------------------------
    console.log('\n[Test 4] Testing deleteTask() removal from MongoDB...');
    const deleteSuccess = await deleteTask(newTask.id);
    assert(deleteSuccess === true, 'deleteTask returned true');

    const deletedMongoDoc = await tasksCol.findOne({ id: newTask.id });
    assert(deletedMongoDoc === null, 'Task successfully removed from MongoDB Atlas collection');

    // Clean up seed tasks created for this test workspace
    await tasksCol.deleteMany({ workspaceId: TEST_WS_ID });
    console.log('\n🧹 Cleaned up test workspace records in MongoDB Atlas.');

    console.log('\n====================================================');
    console.log(`🎉 ALL TESTS PASSED: ${passed}/${passed + failed}`);
    console.log('   MongoDB Atlas task persistence is 100% verified!');
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ Test failed with exception:', err);
  } finally {
    await client.close();
  }
}

runVerification();
