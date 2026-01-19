// Sinographic Integration - Main JavaScript File

// Configuration
const CONFIG = {
    itemsPerPage: 10,
    maxHistory: 50,
    defaultConfidence: 0.85
};

// Application State
let appState = {
    currentWord: '',
    currentResult: null,
    searchHistory: [],
    database: [],
    filteredDatabase: [],
    currentPage: 1,
    searchTerm: '',
    selectedCategory: 'all'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Sinographic Integration App Initializing...');
    
    // Load mapping data
    await loadMappingData();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Initialize database table
    initializeDatabaseTable();
    
    // Show initial random word
    showRandomWord();
    
    console.log('App initialized successfully!');
});

// Load mapping data from JSON file
async function loadMappingData() {
    try {
        const response = await fetch('data/mapping.json');
        const data = await response.json();
        appState.database = data;
        appState.filteredDatabase = [...data];
        console.log(`Loaded ${data.length} mapping entries`);
    } catch (error) {
        console.error('Error loading mapping data:', error);
        // Fallback to embedded data
        loadFallbackData();
    }
}

// Fallback data in case JSON file fails
function loadFallbackData() {
    appState.database = [
        {
            english: "photography",
            chinese: "摄影",
            pinyin: "shè yǐng",
            category: "Modern/Abstract",
            priority: 3,
            analysis: {
                structure: "photo (光) + graphy (写)",
                morphemes: ["photo", "graphy"],
                meaning: "光写 → 摄影",
                matchType: "classical_compound"
            }
        },
        {
            english: "democracy",
            chinese: "民主",
            pinyin: "mín zhǔ",
            category: "Modern/Abstract",
            priority: 3,
            analysis: {
                structure: "demo (民) + cracy (治)",
                morphemes: ["demo", "cracy"],
                meaning: "民治 → 民主",
                matchType: "classical_compound"
            }
        },
        // Add more fallback entries as needed
    ];
    appState.filteredDatabase = [...appState.database];
}

// Initialize all event listeners
function initializeEventListeners() {
    // Analyze button
    document.getElementById('analyze-btn').addEventListener('click', analyzeWord);
    
    // Enter key in input field
    document.getElementById('word-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            analyzeWord();
        }
    });
    
    // Random example button
    document.getElementById('random-btn').addEventListener('click', showRandomWord);
    
    // Quick example tags
    document.querySelectorAll('.example-tag').forEach(tag => {
        tag.addEventListener('click', function() {
            const word = this.dataset.word;
            document.getElementById('word-input').value = word;
            analyzeWord();
        });
    });
    
    // Database search
    document.getElementById('search-db').addEventListener('input', function(e) {
        appState.searchTerm = e.target.value.toLowerCase();
        filterDatabase();
        renderDatabaseTable();
    });
    
    // Category filter
    document.getElementById('category-filter').addEventListener('change', function(e) {
        appState.selectedCategory = e.target.value;
        filterDatabase();
        renderDatabaseTable();
    });
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            switchTab(tabId);
        });
    });
}

// Analyze the input word
function analyzeWord() {
    const wordInput = document.getElementById('word-input');
    const word = wordInput.value.trim().toLowerCase();
    
    if (!word) {
        alert('Please enter an English word');
        wordInput.focus();
        return;
    }
    
    // Show loading modal
    showLoading(true);
    
    // Simulate processing delay
    setTimeout(() => {
        processWord(word);
        showLoading(false);
    }, 800);
    
    // Add to search history
    if (!appState.searchHistory.includes(word)) {
        appState.searchHistory.unshift(word);
        if (appState.searchHistory.length > CONFIG.maxHistory) {
            appState.searchHistory.pop();
        }
    }
    
    // Clear input
    wordInput.value = '';
}

// Process word analysis
function processWord(word) {
    console.log(`Processing word: ${word}`);
    
    // Find the word in database
    const entry = findWordInDatabase(word);
    
    if (entry) {
        // Found exact match
        displayResult(entry);
    } else {
        // Try to analyze word structure
        const analyzed = analyzeWordStructure(word);
        displayResult(analyzed);
    }
    
    // Update URL for sharing
    updateURL(word);
}

// Find word in database (with fallback strategies)
function findWordInDatabase(word) {
    // 1. Try exact match
    let entry = appState.database.find(item => 
        item.english.toLowerCase() === word
    );
    
    if (entry) {
        entry.analysis = entry.analysis || {
            structure: "Direct match",
            morphemes: [word],
            meaning: "Exact correspondence",
            matchType: "direct"
        };
        entry.analysis.confidence = 1.0;
        return entry;
    }
    
    // 2. Try lemma matching (remove common suffixes)
    const lemmas = getLemmas(word);
    for (const lemma of lemmas) {
        entry = appState.database.find(item => 
            item.english.toLowerCase() === lemma
        );
        if (entry) {
            entry.analysis = {
                structure: `Base form: ${lemma}`,
                morphemes: [lemma],
                meaning: `From base word "${lemma}"`,
                matchType: "lemma",
                confidence: 0.9
            };
            return entry;
        }
    }
    
    // 3. Try fuzzy matching
    entry = findFuzzyMatch(word);
    if (entry) {
        entry.analysis = {
            structure: `Similar to "${entry.english}"`,
            morphemes: [entry.english],
            meaning: `Close match to "${entry.english}"`,
            matchType: "fuzzy",
            confidence: entry.similarity || 0.7
        };
        return entry;
    }
    
    return null;
}

// Get lemmas (simplified version)
function getLemmas(word) {
    const lemmas = [word];
    
    // Remove common suffixes
    const suffixes = ['s', 'es', 'ed', 'ing', 'ly', 'ment', 'ness', 'tion'];
    
    for (const suffix of suffixes) {
        if (word.endsWith(suffix) && word.length > suffix.length + 2) {
            const base = word.slice(0, -suffix.length);
            lemmas.push(base);
            
            // Handle special cases
            if (suffix === 'es' && word.endsWith('ies')) {
                lemmas.push(word.slice(0, -3) + 'y');
            }
            if (suffix === 'ed' && word.endsWith('ied')) {
                lemmas.push(word.slice(0, -3) + 'y');
            }
        }
    }
    
    // Remove common prefixes
    const prefixes = ['un', 'dis', 're', 'pre', 'mis', 'over', 'under'];
    for (const prefix of prefixes) {
        if (word.startsWith(prefix) && word.length > prefix.length + 2) {
            lemmas.push(word.slice(prefix.length));
        }
    }
    
    return [...new Set(lemmas)]; // Remove duplicates
}

// Find fuzzy match
function findFuzzyMatch(word) {
    let bestMatch = null;
    let bestSimilarity = 0;
    
    for (const entry of appState.database) {
        const similarity = calculateSimilarity(word, entry.english.toLowerCase());
        
        if (similarity > bestSimilarity && similarity > 0.6) {
            bestSimilarity = similarity;
            bestMatch = { ...entry, similarity };
        }
    }
    
    return bestMatch;
}

// Calculate string similarity (Levenshtein distance based)
function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    // Check for substring
    if (longer.includes(shorter)) return 0.9;
    
    // Simple character overlap
    const set1 = new Set(str1);
    const set2 = new Set(str2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
}

// Analyze word structure (for unknown words)
function analyzeWordStructure(word) {
    const analysis = {
        english: word,
        chinese: "[Analysis in progress...]",
        pinyin: "",
        category: "Unknown",
        priority: 5,
        analysis: {
            structure: "",
            morphemes: [],
            meaning: "",
            matchType: "analysis",
            confidence: 0.5
        }
    };
    
    // Check for classical roots
    const classicalRoots = detectClassicalRoots(word);
    if (classicalRoots.length > 0) {
        analysis.analysis.structure = classicalRoots.map(r => `${r.root} (${r.meaning})`).join(' + ');
        analysis.analysis.morphemes = classicalRoots.map(r => r.root);
        analysis.analysis.meaning = classicalRoots.map(r => r.meaning).join('');
        analysis.analysis.matchType = "classical_analysis";
        analysis.analysis.confidence = 0.7;
        
        // Generate Chinese approximation
        analysis.chinese = classicalRoots.map(r => r.meaning).join('');
    } else {
        // Try to segment compound word
        const segments = segmentCompoundWord(word);
        if (segments.length > 1) {
            analysis.analysis.structure = segments.join(' + ');
            analysis.analysis.morphemes = segments;
            analysis.analysis.matchType = "compound_analysis";
            analysis.analysis.confidence = 0.6;
        } else {
            analysis.analysis.structure = "Simple word";
            analysis.analysis.morphemes = [word];
            analysis.analysis.matchType = "unknown";
            analysis.analysis.confidence = 0.3;
        }
    }
    
    // Generate pinyin placeholder
    analysis.pinyin = generatePinyin(analysis.chinese);
    
    return analysis;
}

// Detect classical roots in word
function detectClassicalRoots(word) {
    const classicalRoots = {
        'photo': '光', 'graph': '写', 'tele': '远', 'phon': '声',
        'bio': '生', 'logy': '学', 'demo': '民', 'cracy': '治',
        'geo': '地', 'therm': '热', 'hydro': '水', 'psych': '心',
        'chron': '时', 'astr': '星', 'anthrop': '人', 'soci': '社'
    };
    
    const foundRoots = [];
    
    for (const [root, meaning] of Object.entries(classicalRoots)) {
        if (word.includes(root)) {
            foundRoots.push({
                root,
                meaning,
                position: word.indexOf(root)
            });
        }
    }
    
    // Sort by position in word
    foundRoots.sort((a, b) => a.position - b.position);
    
    return foundRoots;
}

// Segment compound word
function segmentCompoundWord(word) {
    // Common patterns for compound words
    const patterns = [
        /^(\w+)(graphy|logy|nomy|sophy|pathy)$/,
        /^(micro|macro|tele|hydro|psych|chron)(\w+)$/,
        /^(\w+)(able|ible|ful|less|ness|ment|tion|sion)$/,
        /^(un|dis|re|pre|mis|over|under)(\w+)$/
    ];
    
    for (const pattern of patterns) {
        const match = word.match(pattern);
        if (match) {
            return match.slice(1).filter(segment => segment.length > 1);
        }
    }
    
    // Try to find common boundaries
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const segments = [];
    let currentSegment = '';
    
    for (let i = 0; i < word.length; i++) {
        currentSegment += word[i];
        
        // Check for boundary
        if (i < word.length - 1) {
            const currentIsVowel = vowels.includes(word[i]);
            const nextIsConsonant = !vowels.includes(word[i + 1]);
            
            if (currentIsVowel && nextIsConsonant && currentSegment.length > 2) {
                const remaining = word.slice(i + 1);
                if (remaining.length > 2) {
                    segments.push(currentSegment);
                    currentSegment = '';
                }
            }
        }
    }
    
    if (currentSegment) {
        segments.push(currentSegment);
    }
    
    return segments.length > 1 ? segments : [word];
}

// Generate pinyin placeholder (simplified)
function generatePinyin(chinese) {
    if (!chinese || chinese.startsWith('[')) return '';
    
    // Very simplified pinyin mapping
    const pinyinMap = {
        '摄': 'shè', '影': 'yǐng',
        '民': 'mín', '主': 'zhǔ',
        '生': 'shēng', '物': 'wù', '学': 'xué',
        '光': 'guāng', '写': 'xiě',
        '电': 'diàn', '话': 'huà'
    };
    
    return Array.from(chinese).map(char => 
        pinyinMap[char] || char
    ).join(' ');
}

// Display analysis result
function displayResult(entry) {
    appState.currentWord = entry.english;
    appState.currentResult = entry;
    
    // Update main display
    document.getElementById('english-word-display').textContent = entry.english;
    document.getElementById('chinese-result-display').innerHTML = `
        <span class="chinese-characters">${entry.chinese}</span>
        <span class="pinyin" id="pinyin-display">${entry.pinyin}</span>
    `;
    
    // Update confidence
    const confidence = entry.analysis.confidence || CONFIG.defaultConfidence;
    document.getElementById('confidence-value').textContent = confidence.toFixed(2);
    document.getElementById('confidence-badge').style.background = 
        confidence > 0.8 ? '#d1fae5' : 
        confidence > 0.6 ? '#fef3c7' : '#fee2e2';
    document.getElementById('confidence-value').style.color = 
        confidence > 0.8 ? '#065f46' : 
        confidence > 0.6 ? '#92400e' : '#991b1b';
    
    // Update mapping type
    document.getElementById('mapping-type').textContent = 
        entry.analysis.matchType.replace('_', ' ').toUpperCase();
    
    // Update analysis details
    document.getElementById('word-structure').textContent = entry.analysis.structure;
    document.getElementById('morpheme-breakdown').textContent = 
        Array.isArray(entry.analysis.morphemes) ? 
        entry.analysis.morphemes.join(' + ') : 
        entry.analysis.morphemes;
    document.getElementById('semantic-category').textContent = entry.category;
    document.getElementById('match-type').textContent = entry.analysis.matchType;
    
    // Update tabs
    updateEtymologyTab(entry);
    updateSynonymsTab(entry);
    updateExamplesTab(entry);
    
    // Add animation
    document.querySelector('.mapping-display').classList.add('highlight');
    setTimeout(() => {
        document.querySelector('.mapping-display').classList.remove('highlight');
    }, 1000);
}

// Update etymology tab
function updateEtymologyTab(entry) {
    const content = document.getElementById('etymology-content');
    
    if (entry.analysis.matchType.includes('classical')) {
        const roots = detectClassicalRoots(entry.english);
        
        let html = `
            <h4>Classical Etymology Analysis</h4>
            <p>This word is derived from classical roots:</p>
            <div class="etymology-breakdown">
        `;
        
        roots.forEach(root => {
            html += `
                <div class="etymology-item">
                    <span class="etymology-english">${root.root}</span>
                    <span class="etymology-arrow">→</span>
                    <span class="etymology-chinese">${root.meaning}</span>
                    <span class="etymology-meaning">(${getRootMeaning(root.root)})</span>
                </div>
            `;
        });
        
        html += `
            </div>
            <p><strong>Combined Meaning:</strong> ${entry.analysis.meaning}</p>
        `;
        
        content.innerHTML = html;
    } else {
        content.innerHTML = `
            <h4>Word Analysis</h4>
            <p><strong>Structure:</strong> ${entry.analysis.structure}</p>
            <p><strong>Morphemes:</strong> ${Array.isArray(entry.analysis.morphemes) ? 
                entry.analysis.morphemes.join(', ') : entry.analysis.morphemes}</p>
            <p><strong>Mapping Method:</strong> ${entry.analysis.matchType}</p>
            <p><strong>Confidence Level:</strong> ${(entry.analysis.confidence * 100).toFixed(1)}%</p>
        `;
    }
}

// Get meaning for classical root
function getRootMeaning(root) {
    const meanings = {
        'photo': 'light', 'graph': 'write', 'tele': 'far', 'phon': 'sound',
        'bio': 'life', 'logy': 'study', 'demo': 'people', 'cracy': 'rule',
        'geo': 'earth', 'therm': 'heat', 'hydro': 'water', 'psych': 'mind'
    };
    return meanings[root] || 'unknown meaning';
}

// Update synonyms tab
function updateSynonymsTab(entry) {
    const content = document.getElementById('synonyms-content');
    
    // Generate synonyms (simplified)
    const synonyms = generateSynonyms(entry.english);
    
    let html = `<h4>Related Words and Synonyms</h4>`;
    
    if (synonyms.length > 0) {
        html += `
            <p>Words related to <strong>${entry.english}</strong>:</p>
            <div class="synonyms-grid">
        `;
        
        synonyms.forEach(synonym => {
            html += `
                <div class="synonym-item" onclick="analyzeRelatedWord('${synonym}')">
                    ${synonym}
                </div>
            `;
        });
        
        html += `</div>`;
    } else {
        html += `<p>No synonyms found for "${entry.english}" in the database.</p>`;
    }
    
    content.innerHTML = html;
}

// Generate synonyms (simplified)
function generateSynonyms(word) {
    const synonymGroups = {
        'beautiful': ['pretty', 'attractive', 'lovely', 'gorgeous'],
        'big': ['large', 'huge', 'enormous', 'massive'],
        'small': ['little', 'tiny', 'miniature', 'petite'],
        'happy': ['joyful', 'cheerful', 'delighted', 'pleased'],
        'sad': ['unhappy', 'sorrowful', 'melancholy', 'depressed'],
        'run': ['jog', 'sprint', 'dash', 'race'],
        'walk': ['stroll', 'amble', 'saunter', 'hike']
    };
    
    return synonymGroups[word] || [];
}

// Update examples tab
function updateExamplesTab(entry) {
    const content = document.getElementById('examples-content');
    const examples = generateExamples(entry.english, entry.chinese);
    
    let html = `<h4>Usage Examples</h4>`;
    
    if (examples.length > 0) {
        examples.forEach(example => {
            html += `
                <div class="example-sentence">
                    <div class="example-english">${example.english}</div>
                    <div class="example-chinese">${example.chinese}</div>
                </div>
            `;
        });
    } else {
        html += `<p>No examples available for "${entry.english}".</p>`;
    }
    
    content.innerHTML = html;
}

// Generate example sentences
function generateExamples(english, chinese) {
    const examples = {
        'photography': [
            {
                english: "She studied photography at university.",
                chinese: "她在大学学习摄影。"
            },
            {
                english: "Digital photography has revolutionized the way we capture moments.",
                chinese: "数码摄影彻底改变了我们记录瞬间的方式。"
            }
        ],
        'democracy': [
            {
                english: "The country transitioned to democracy in the 1990s.",
                chinese: "这个国家在20世纪90年代过渡到了民主。"
            },
            {
                english: "Free elections are fundamental to democracy.",
                chinese: "自由选举是民主的基础。"
            }
        ],
        'biology': [
            {
                english: "He majored in molecular biology.",
                chinese: "他主修分子生物学。"
            },
            {
                english: "Marine biology studies life in the oceans.",
                chinese: "海洋生物学研究海洋中的生命。"
            }
        ]
    };
    
    return examples[english] || [];
}

// Initialize database table
function initializeDatabaseTable() {
    renderDatabaseTable();
}

// Filter database based on search and category
function filterDatabase() {
    const { searchTerm, selectedCategory, database } = appState;
    
    appState.filteredDatabase = database.filter(item => {
        // Search term filter
        const matchesSearch = !searchTerm || 
            item.english.toLowerCase().includes(searchTerm) ||
            item.chinese.includes(searchTerm) ||
            item.pinyin.toLowerCase().includes(searchTerm);
        
        // Category filter
        const matchesCategory = selectedCategory === 'all' || 
            item.category.toLowerCase().includes(selectedCategory);
        
        return matchesSearch && matchesCategory;
    });
    
    appState.currentPage = 1;
}

// Render database table
function renderDatabaseTable() {
    const tableBody = document.getElementById('database-table-body');
    const { filteredDatabase, currentPage } = appState;
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * CONFIG.itemsPerPage;
    const endIndex = startIndex + CONFIG.itemsPerPage;
    const pageItems = filteredDatabase.slice(startIndex, endIndex);
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Populate table
    pageItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${item.english}</strong></td>
            <td class="chinese-cell">${item.chinese}</td>
            <td>${item.pinyin}</td>
            <td><span class="category-badge category-${getCategoryClass(item.category)}">${item.category}</span></td>
            <td><span class="priority-badge priority-${item.priority}">${item.priority}</span></td>
        `;
        
        // Make row clickable
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => {
            document.getElementById('word-input').value = item.english;
            analyzeWord();
        });
        
        tableBody.appendChild(row);
    });
    
    // Update pagination
    updatePagination();
}

// Get CSS class for category
function getCategoryClass(category) {
    const categoryMap = {
        'Nature/Existence': 'nature',
        'People/Society': 'society',
        'Actions/Changes': 'actions',
        'Qualities/Degree': 'qualities',
        'Modern/Abstract': 'modern'
    };
    
    for (const [key, value] of Object.entries(categoryMap)) {
        if (category.includes(key.split('/')[0])) {
            return value;
        }
    }
    
    return 'modern';
}

// Update pagination controls
function updatePagination() {
    const pagination = document.getElementById('pagination');
    const totalItems = appState.filteredDatabase.length;
    const totalPages = Math.ceil(totalItems / CONFIG.itemsPerPage);
    
    let html = `
        <button class="pagination-btn" onclick="changePage(${appState.currentPage - 1})" 
                ${appState.currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
        
        <span class="pagination-info">
            Page ${appState.currentPage} of ${totalPages}
            (${totalItems} items)
        </span>
        
        <button class="pagination-btn" onclick="changePage(${appState.currentPage + 1})" 
                ${appState.currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    pagination.innerHTML = html;
}

// Change page (exposed for onclick)
window.changePage = function(page) {
    if (page < 1 || page > Math.ceil(appState.filteredDatabase.length / CONFIG.itemsPerPage)) {
        return;
    }
    
    appState.currentPage = page;
    renderDatabaseTable();
    
    // Scroll to database section
    document.querySelector('.database-section').scrollIntoView({
        behavior: 'smooth'
    });
};

// Switch between tabs
function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(`${tabId}-tab`).classList.add('active');
}

// Show random word
function showRandomWord() {
    if (appState.database.length === 0) {
        alert('Database not loaded yet');
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * appState.database.length);
    const randomWord = appState.database[randomIndex].english;
    
    document.getElementById('word-input').value = randomWord;
    analyzeWord();
}

// Show loading modal
function showLoading(show) {
    const modal = document.getElementById('loading-modal');
    if (show) {
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
    }
}

// Update URL for sharing
function updateURL(word) {
    const url = new URL(window.location);
    url.searchParams.set('word', word);
    window.history.pushState({}, '', url);
}

// Check for word in URL on load
function checkURLForWord() {
    const urlParams = new URLSearchParams(window.location.search);
    const word = urlParams.get('word');
    
    if (word) {
        document.getElementById('word-input').value = word;
        setTimeout(() => analyzeWord(), 500);
    }
}

// Analyze related word (for synonyms)
window.analyzeRelatedWord = function(word) {
    document.getElementById('word-input').value = word;
    analyzeWord();
};

// Add to window for debugging
window.appState = appState;
