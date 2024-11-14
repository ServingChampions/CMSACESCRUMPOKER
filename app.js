import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, deleteDoc } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTIuVn8IBPtAHfIL5AiSPtjw1ynFnais8",
  authDomain: "scrum-poker-board-1fdfb.firebaseapp.com",
  projectId: "scrum-poker-board-1fdfb",
  storageBucket: "scrum-poker-board-1fdfb.firebasestorage.app",
  messagingSenderId: "352702822956",
  appId: "1:352702822956:web:2185599557476d68c36f89",
  measurementId: "G-JL3HC47F5Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM elements
const cards = document.querySelectorAll('.card');
const workItemInput = document.getElementById('work-item');
const workItemDisplay = document.getElementById('work-item-display');
const voteHistoryTable = document.getElementById('vote-history').getElementsByTagName('tbody')[0];
const userNameInput = document.getElementById('user-name');
const startVotingButton = document.getElementById('start-voting');
const toggleScoresButton = document.getElementById('toggle-scores');
const winnerTableBody = document.querySelector('#winner-table tbody');

// Variables
let currentUserName = '';
let showScores = false; // Track whether scores are visible

// Sign in anonymously (for simplicity in this example)
signInAnonymously(auth)
  .then(() => {
    console.log("User signed in anonymously.");
  })
  .catch((error) => {
    console.error("Error signing in: ", error);
  });

// Start voting after user enters their name
startVotingButton.addEventListener('click', () => {
  currentUserName = userNameInput.value.trim();
  if (!currentUserName) {
    alert("Please enter a name.");
    return;
  }
  alert(`Welcome ${currentUserName}! You can now vote.`);
  startVotingButton.style.display = 'none'; // Hide the start button
  toggleScoresButton.style.display = 'inline'; // Show the "Show Scores" button
});

// Handle card clicks (voting)
cards.forEach(card => {
  card.addEventListener('click', async () => {
    if (!currentUserName) {
      alert("Please enter your name first.");
      return;
    }

    const voteValue = card.getAttribute('data-value');
    const workItemId = workItemInput.value.trim();

    if (!workItemId) {
      alert("Please enter a work item ID.");
      return;
    }

    // Update the current work item display
    workItemDisplay.textContent = workItemId;

    // Add vote to Firestore
    try {
      await addDoc(collection(db, 'votes'), {
        workItemId: workItemId,
        vote: voteValue,
        user: currentUserName,
        timestamp: serverTimestamp() // Timestamp for sorting
      });
      console.log("Vote added to Firestore.");
    } catch (error) {
      console.error("Error adding vote: ", error);
    }
  });
});

// Real-time listener for votes
const votesQuery = query(collection(db, 'votes'), orderBy('timestamp'));
onSnapshot(votesQuery, snapshot => {
  renderVoteHistory(snapshot);
});

// Function to render the vote table
function renderVoteHistory(snapshot) {
  // Clear current table
  voteHistoryTable.innerHTML = '';

  // Add each vote to the table
  snapshot.forEach(doc => {
    const voteData = doc.data();
    const row = document.createElement('tr');

    const workItemCell = document.createElement('td');
    const nameCell = document.createElement('td');
    const voteCell = document.createElement('td');

    workItemCell.textContent = voteData.workItemId;
    nameCell.textContent = voteData.user;

    // Show or hide votes based on `showScores`
    voteCell.textContent = showScores ? voteData.vote : 'Hidden';

    row.appendChild(workItemCell);
    row.appendChild(nameCell);
    row.appendChild(voteCell);
    voteHistoryTable.appendChild(row);
  });
}

// Toggle score visibility
toggleScoresButton.addEventListener('click', () => {
  showScores = !showScores;
  toggleScoresButton.textContent = showScores ? 'Hide Scores' : 'Show Scores';

  // Manually re-render the table to reflect the change
  const votesQuery = query(collection(db, 'votes'), orderBy('timestamp'));
  onSnapshot(votesQuery, snapshot => {
    renderVoteHistory(snapshot);
  });
});

// Firestore reference for the "winners" collection
const winnersCollection = collection(db, 'winners');

// Function to add winner data to Firestore
async function addWinnerToFirestore(date, workItem, score) {
  try {
    console.log("Adding winner to Firestore...");
    const docRef = await addDoc(winnersCollection, {
      date: date,
      workItem: workItem,
      score: score,
      timestamp: serverTimestamp() // Optional timestamp for sorting
    });
    console.log("Winner added to Firestore with ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding winner: ", error);
  }
}

// Real-Time Listener for Winners Collection
onSnapshot(query(winnersCollection, orderBy('timestamp')), (snapshot) => {
  console.log("Fetching winners from Firestore...");
  winnerTableBody.innerHTML = ''; // Clear the table

  // Populate table with winner data
  snapshot.forEach((doc) => {
    const winner = doc.data();
    addWinnerToTable(winner.date, winner.workItem, winner.score);
  });
});

// Function to add winner data to the winner table
function addWinnerToTable(date, workItem, score) {
  const newRow = document.createElement('tr');
  newRow.innerHTML = `
    <td>${date}</td>
    <td>${workItem}</td>
    <td>${score}</td>
  `;
  winnerTableBody.appendChild(newRow);
}

// Debugging function to check if winner data is being added
async function checkWinnerData() {
  const snapshot = await getDocs(winnersCollection);
  snapshot.forEach(doc => {
    console.log("Winner document:", doc.data());
  });
}

// Example usage to check if winners are saved
checkWinnerData();

// Function to clear votes
async function clearVotes() {
  try {
    // Retrieve all votes from Firestore and delete them
    const votesSnapshot = await getDocs(collection(db, 'votes'));
    votesSnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref); // Delete each vote
    });
    console.log("All votes cleared from Firestore.");
  } catch (error) {
    console.error("Error clearing votes: ", error);
  }
}

// Add the clear button event listener
const clearVotesButton = document.getElementById('clear-votes');
clearVotesButton.addEventListener('click', clearVotes);

