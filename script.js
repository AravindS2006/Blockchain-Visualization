const SHA256 = CryptoJS.SHA256;

class Block {
    constructor(index, timestamp, data, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return SHA256(this.index + this.previousHash + this.timestamp + this.data + this.nonce).toString();
    }

    mineBlock(difficulty) {
        let startTime = Date.now();
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        let endTime = Date.now();
        this.miningTime = endTime - startTime;
        console.log("BLOCK MINED: " + this.hash + " in " + this.miningTime + "ms");
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.miningReward = 100;
        this.blockTime = 30000;
    }

    createGenesisBlock() {
        return new Block(0, Date.now(), "Genesis Block", "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(newBlock) {
        newBlock.previousHash = this.getLatestBlock().hash;
        newBlock.index = this.getLatestBlock().index + 1;
        showMiningStatus("Mining block...");
        const startTime = Date.now();
        newBlock.mineBlock(this.difficulty);
        const endTime = Date.now();
        hideMiningStatus();
        this.chain.push(newBlock);
        displayMiningCost(newBlock.miningTime);
        updateAnalytics();  // Make sure to update analytics
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }
            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    adjustDifficulty() {
        const latestBlock = this.getLatestBlock();
        if (latestBlock.miningTime < (this.blockTime / 2)) {
            this.difficulty++;
        } else if (latestBlock.miningTime > (this.blockTime * 2)) {
            this.difficulty--;
            if (this.difficulty < 1) this.difficulty = 1;
        }
        console.log(`Difficulty adjusted to: ${this.difficulty}`);
        displayCurrentDifficulty(); //show Difficulty
        updateAnalytics(); //Call update analytics
    }

    lookupTransaction(transactionData) {
        const sanitizedData = transactionData.trim().toLowerCase();
        for (const block of this.chain) {
            if (typeof block.data === 'string' && block.data.toLowerCase().includes(sanitizedData)) {
                return { blockIndex: block.index, data: block.data };
            }
        }
        return null;
    }
}

// UI Elements
const blockchainContainer = document.getElementById('blockchain-container');
const transactionDataInput = document.getElementById('transaction-data');
const addTransactionButton = document.getElementById('add-transaction-button');
const miningStatusDiv = document.getElementById('mining-status');
const miningCostDiv = document.getElementById('mining-cost');
const blockModal = document.getElementById('block-modal');
const modalBlockIndex = document.getElementById('modal-block-index');
const modalBlockTimestamp = document.getElementById('modal-block-timestamp');
const modalBlockData = document.getElementById('modal-block-data');
const modalBlockPreviousHash = document.getElementById('modal-block-previous-hash');
const modalBlockHash = document.getElementById('modal-block-hash');
const closeModalSpan = document.getElementsByClassName("close")[0];
const themeToggle = document.querySelector('.theme-toggle');
const lookupTransactionButton = document.getElementById('lookup-transaction-button');
const transactionIdInput = document.getElementById('transaction-id');
const transactionLookupResultsDiv = document.getElementById('transaction-lookup-results');

// Analytics UI Elements
const totalBlocksSpan = document.getElementById('total-blocks');
const averageMiningTimeSpan = document.getElementById('average-mining-time');
const currentDifficultySpan = document.getElementById('current-difficulty');

// Settings UI Elements
const saveSettingsButton = document.getElementById('save-settings');
const nodeUrlInput = document.getElementById('node-url');
const refreshIntervalInput = document.getElementById('refresh-interval');

// Under Construction UI elements
const constructionSection = document.getElementById('construction-section');
const mainContent = document.querySelector('main');


let myCoin = new Blockchain();
let currentTheme = localStorage.getItem('theme') || 'dark';

// Load settings or use defaults
let settings = JSON.parse(localStorage.getItem('settings')) || {
    nodeUrl: '',
    refreshInterval: 60
};

// Function to set theme
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    currentTheme = theme;
    updateThemeIcons();
}

// Update theme icons
function updateThemeIcons() {
    if (currentTheme === 'light') {
        document.querySelector('.theme-toggle .fa-moon').style.display = 'inline';
        document.querySelector('.theme-toggle .fa-sun').style.display = 'none';
    } else {
        document.querySelector('.theme-toggle .fa-moon').style.display = 'none';
        document.querySelector('.theme-toggle .fa-sun').style.display = 'inline';
    }
}

// Event listener for theme toggle
themeToggle.addEventListener('click', () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
});

// Function to save settings
function saveSettings() {
    settings.nodeUrl = nodeUrlInput.value;
    settings.refreshInterval = refreshIntervalInput.value;
    localStorage.setItem('settings', JSON.stringify(settings));
    alert('Settings Saved!');
}

function loadSettings() {
    nodeUrlInput.value = settings.nodeUrl;
    refreshIntervalInput.value = settings.refreshInterval;
}

// Initial blockchain setup
myCoin.addBlock(new Block(1, Date.now(), { amount: 4 }));
myCoin.addBlock(new Block(2, Date.now(), { amount: 10 }));
myCoin.addBlock(new Block(3, Date.now(), { amount: 5 }));
myCoin.addBlock(new Block(4, Date.now(), { amount: 25 }));
myCoin.addBlock(new Block(5, Date.now(), { amount: 30 }));

// UI Functions
function displayBlockchain() {
    blockchainContainer.innerHTML = '';
    myCoin.chain.forEach(block => {
        const blockDiv = document.createElement('div');
        blockDiv.classList.add('block');
        blockDiv.innerHTML = `
            <strong>Block ${block.index}</strong><br>
            Timestamp: ${new Date(block.timestamp).toLocaleString()}<br>
            Data: ${block.data}<br>
            Hash: ${block.hash.substring(0,10)}...<br>
            Previous Hash: ${block.previousHash.substring(0,10)}...
        `;
        blockDiv.addEventListener('click', () => {
            openBlockModal(block);
        });
        blockchainContainer.appendChild(blockDiv);
    });
}

function showMiningStatus(message) {
    miningStatusDiv.innerText = message;
}

function hideMiningStatus() {
    miningStatusDiv.innerText = '';
}

function displayMiningCost(miningTime) {
    miningCostDiv.innerText = `Mining Cost: ${miningTime} ms`;
}
function displayCurrentDifficulty() {
  miningCostDiv.innerText = `Current difficulty: ${myCoin.difficulty}`; //Added difficulty info on same div
}

// Event Listener for Add Transaction Button
addTransactionButton.addEventListener('click', () => {
    const data = transactionDataInput.value;
    if (data) {
        const newBlock = new Block(null, Date.now(), data);
        myCoin.addBlock(newBlock);
        myCoin.adjustDifficulty();
        displayBlockchain();
        transactionDataInput.value = '';
    } else {
        alert("Please enter transaction data.");
    }
});

// Block Details Modal Functions
function openBlockModal(block) {
    modalBlockIndex.innerText = `Block ${block.index}`;
    modalBlockTimestamp.innerText = `Timestamp: ${new Date(block.timestamp).toLocaleString()}`;
    modalBlockData.innerText = `Data: ${block.data}`;
    modalBlockPreviousHash.innerText = `Previous Hash: ${block.previousHash}`;
    modalBlockHash.innerText = `Hash: ${block.hash}`;
    blockModal.style.display = "block";
}

closeModalSpan.onclick = function() {
    blockModal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == blockModal) {
        blockModal.style.display = "none";
    }
}

// Lookup Function Listener
lookupTransactionButton.addEventListener('click', () => {
    const transactionId = transactionIdInput.value;
    if (transactionId) {
        const result = myCoin.lookupTransaction(transactionId);
        if (result) {
            transactionLookupResultsDiv.innerHTML = `Transaction found in Block ${result.blockIndex}: Data: ${result.data}`;
        } else {
            transactionLookupResultsDiv.innerHTML = 'Transaction not found in the blockchain.';
        }
    } else {
        alert("Please enter a transaction ID or part of the transaction data.");
    }
});

// Listener for input changes on transaction ID
transactionIdInput.addEventListener('input', () => {
    if(transactionIdInput.value.trim().length === 0 ) {
        transactionLookupResultsDiv.innerHTML = '';
    }
})

// Event Listener for Save Settings Button
saveSettingsButton.addEventListener('click', saveSettings);

// Initialize the UI and analytics
setTheme(currentTheme);
loadSettings();
displayBlockchain();
updateAnalytics();
displayCurrentDifficulty();

// Cursor Effects (Corrected placement)
const cursor = document.querySelector(".cursor");
const cursor2 = document.querySelector(".cursor2");
document.addEventListener('mousemove', function(e){
    cursor.style.cssText = cursor2.style.cssText = "left: " + e.clientX + "px; top: " + e.clientY + "px;";
});

// --- Under Construction Logic ---
const blockchainLink = document.querySelector('header nav a[href="#blockchain-section"]');
const transactionLink = document.querySelector('header nav a[href="#transaction-section"]');
const analyticsLink = document.querySelector('header nav a[href="#analytics-section"]');
const settingsLink = document.querySelector('header nav a[href="#settings-section"]');


function showUnderConstruction() {
  mainContent.style.display = 'none';  // Hide <main>
  constructionSection.style.display = 'block'; // Show construction section
   //Remove other content, using querySelectorAll
  document.querySelectorAll('main > section:not(#construction-section)').forEach(section => {
    section.style.display = 'none';
  });

  animateProgressBar();
  createConfetti(); // Start confetti when showing under construction
}

// Attach event listeners to the dummy links
analyticsLink.addEventListener('click', (event) => {
    event.preventDefault();
    showUnderConstruction();
});

settingsLink.addEventListener('click', (event) => {
    event.preventDefault();
    showUnderConstruction();
});

function hideUnderConstruction(){
    //Refresh to make all visible again.
   document.querySelectorAll('main > section').forEach(section => {
      section.style.display = 'block';
    });

    constructionSection.style.display = 'none'; // Hide the construction section
}


// Progress Bar Animation
function animateProgressBar() {
 const progressIndicator = document.querySelector('.progress-indicator');
  let progress = 0;
   function updateProgress() {
    progress += 1;
        progressIndicator.style.width = `${progress}%`;
      if (progress >= 100) {
          progress = 0; // Reset progress
        }
        // Check if #construction-section is still visible
      if (constructionSection.style.display !== 'none') {
            setTimeout(updateProgress, 20);
       }
    }
     updateProgress();
}

// Confetti Animation
function createConfetti() {
   const confettiContainer = document.querySelector('.confetti-container');
      if (!confettiContainer) return; //Exit if container is null.

    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.animationDelay = `${Math.random() * 2}s`;
    confettiContainer.appendChild(confetti);

    confetti.addEventListener('animationend', () => {
        confetti.remove();
    });
     // Create multiple confetti pieces, check for visbility
     if (constructionSection.style.display != "none") {
      setTimeout(createConfetti, 200); // Stagger creation
  }

}
//Update Analytics
function updateAnalytics() {
  totalBlocksSpan.innerText = myCoin.chain.length;

    let totalMiningTime = 0;
    for (let i = 1; i < myCoin.chain.length; i++) { // start at 1 to skip genesis block
      totalMiningTime += myCoin.chain[i].miningTime;
    }

    let avgTime = 0;
    if (myCoin.chain.length > 1) {  //Avoid division with 0.
      avgTime = totalMiningTime / (myCoin.chain.length - 1);  // Correct number of mined blocks.
    }
    averageMiningTimeSpan.innerText = `${avgTime.toFixed(2)} ms`;
    currentDifficultySpan.innerText = myCoin.difficulty;
}