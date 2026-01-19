// enhanced_script.js - 使用现有数据库的增强版本
let WORD_DATABASE = [];
let ROOT_DATABASE = {};
let MORPHEME_RULES = {};

// 初始化应用
async function initApp() {
    console.log('正在初始化Sinographic Integration应用...');
    
    // 1. 加载数据库
    await loadDatabase();
    
    // 2. 建立索引
    buildIndexes();
    
    // 3. 初始化UI
    initUI();
    
    // 4. 显示随机示例
    showRandomExample();
    
    console.log('应用初始化完成！');
}

// 加载数据库
async function loadDatabase() {
    try {
        const response = await fetch('sinographic_mapping.json');
        WORD_DATABASE = await response.json();
        console.log(`已加载 ${WORD_DATABASE.length} 个单词映射`);
        
        // 提取词根数据
        extractRootData();
        
    } catch (error) {
        console.error('加载数据库失败:', error);
        await loadFallbackData();
    }
}

// 从数据库中提取词根信息
function extractRootData() {
    ROOT_DATABASE = {};
    MORPHEME_RULES = {
        prefixes: ['un', 'dis', 're', 'pre', 'mis', 'over', 'under', 'sub', 'super', 'inter', 'intra', 'trans'],
        suffixes: ['ing', 'ed', 's', 'es', 'ly', 'ment', 'ness', 'tion', 'sion', 'able', 'ible', 'al', 'ial', 'ful', 'less', 'ize', 'ise', 'ity', 'ism', 'ist', 'ance', 'ence', 'hood', 'ship', 'dom'],
        inflections: ['s', 'es', 'ed', 'ing', 'er', 'est']
    };
    
    // 按词长、首字母等建立索引
    WORD_DATABASE.forEach((word, index) => {
        const eng = word.english.toLowerCase();
        
        // 建立直接索引
        ROOT_DATABASE[eng] = word;
        
        // 按词长索引
        if (!ROOT_DATABASE[`length_${eng.length}`]) {
            ROOT_DATABASE[`length_${eng.length}`] = [];
        }
        ROOT_DATABASE[`length_${eng.length}`].push(word);
        
        // 按首字母索引
        const firstLetter = eng[0];
        if (!ROOT_DATABASE[`letter_${firstLetter}`]) {
            ROOT_DATABASE[`letter_${firstLetter}`] = [];
        }
        ROOT_DATABASE[`letter_${firstLetter}`].push(word);
    });
    
    console.log('词根数据库索引构建完成');
}

// 智能单词分析器
class IntelligentWordAnalyzer {
    constructor() {
        this.cache = new Map();
    }
    
    // 分析单词
    analyze(word) {
        const lowerWord = word.toLowerCase().trim();
        
        // 检查缓存
        if (this.cache.has(lowerWord)) {
            return this.cache.get(lowerWord);
        }
        
        const analysis = {
            original: word,
            normalized: lowerWord,
            found: false,
            confidence: 0,
            matchType: 'not_found',
            result: null,
            decomposition: [],
            suggestions: [],
            timestamp: Date.now()
        };
        
        // 1. 直接匹配
        const directMatch = this.directMatch(lowerWord);
        if (directMatch) {
            analysis.found = true;
            analysis.confidence = 1.0;
            analysis.matchType = 'direct';
            analysis.result = directMatch;
            this.cache.set(lowerWord, analysis);
            return analysis;
        }
        
        // 2. 词形变化匹配
        const inflectedMatch = this.matchInflections(lowerWord);
        if (inflectedMatch) {
            analysis.found = true;
            analysis.confidence = 0.95;
            analysis.matchType = 'inflection';
            analysis.result = inflectedMatch.result;
            analysis.decomposition = inflectedMatch.decomposition;
            this.cache.set(lowerWord, analysis);
            return analysis;
        }
        
        // 3. 词缀分解匹配
        const affixMatch = this.matchWithAffixes(lowerWord);
        if (affixMatch) {
            analysis.found = true;
            analysis.confidence = affixMatch.confidence;
            analysis.matchType = affixMatch.type;
            analysis.result = affixMatch.result;
            analysis.decomposition = affixMatch.decomposition;
            this.cache.set(lowerWord, analysis);
            return analysis;
        }
        
        // 4. 相似词匹配
        const similarMatch = this.findSimilarWords(lowerWord);
        if (similarMatch) {
            analysis.found = true;
            analysis.confidence = similarMatch.confidence;
            analysis.matchType = 'similar';
            analysis.result = similarMatch.result;
            analysis.suggestions = similarMatch.suggestions;
            this.cache.set(lowerWord, analysis);
            return analysis;
        }
        
        // 5. 复合词分析
        const compoundMatch = this.analyzeCompoundWord(lowerWord);
        if (compoundMatch) {
            analysis.found = true;
            analysis.confidence = compoundMatch.confidence;
            analysis.matchType = 'compound';
            analysis.result = compoundMatch.result;
            analysis.decomposition = compoundMatch.decomposition;
            this.cache.set(lowerWord, analysis);
            return analysis;
        }
        
        // 未找到
        this.cache.set(lowerWord, analysis);
        return analysis;
    }
    
    // 直接匹配
    directMatch(word) {
        return ROOT_DATABASE[word] || null;
    }
    
    // 匹配词形变化
    matchInflections(word) {
        const inflections = MORPHEME_RULES.inflections;
        
        for (const inflection of inflections) {
            // 检查是否是添加了词缀
            if (word.endsWith(inflection)) {
                const base = word.slice(0, -inflection.length);
                const match = this.directMatch(base);
                if (match) {
                    return {
                        result: match,
                        decomposition: [{
                            part: base,
                            type: 'base',
                            chinese: match.chinese
                        }, {
                            part: inflection,
                            type: 'inflection',
                            chinese: this.getInflectionMeaning(inflection)
                        }]
                    };
                }
            }
        }
        
        return null;
    }
    
    // 获取词缀意义
    getInflectionMeaning(inflection) {
        const meanings = {
            's': '复数',
            'es': '复数',
            'ed': '过去式',
            'ing': '进行式',
            'er': '比较级',
            'est': '最高级'
        };
        return meanings[inflection] || '';
    }
    
    // 词缀分解匹配
    matchWithAffixes(word) {
        const { prefixes, suffixes } = MORPHEME_RULES;
        
        // 检查前缀
        for (const prefix of prefixes) {
            if (word.startsWith(prefix) && word.length > prefix.length + 2) {
                const base = word.slice(prefix.length);
                const baseMatch = this.directMatch(base);
                
                if (baseMatch) {
                    return {
                        type: 'prefixed',
                        confidence: 0.85,
                        result: {
                            ...baseMatch,
                            chinese: this.getPrefixMeaning(prefix) + baseMatch.chinese
                        },
                        decomposition: [{
                            part: prefix,
                            type: 'prefix',
                            meaning: this.getPrefixMeaning(prefix)
                        }, {
                            part: base,
                            type: 'base',
                            chinese: baseMatch.chinese
                        }]
                    };
                }
            }
        }
        
        // 检查后缀
        for (const suffix of suffixes) {
            if (word.endsWith(suffix) && word.length > suffix.length + 2) {
                const base = word.slice(0, -suffix.length);
                const baseMatch = this.directMatch(base);
                
                if (baseMatch) {
                    return {
                        type: 'suffixed',
                        confidence: 0.80,
                        result: {
                            ...baseMatch,
                            chinese: baseMatch.chinese + this.getSuffixMeaning(suffix)
                        },
                        decomposition: [{
                            part: base,
                            type: 'base',
                            chinese: baseMatch.chinese
                        }, {
                            part: suffix,
                            type: 'suffix',
                            meaning: this.getSuffixMeaning(suffix)
                        }]
                    };
                }
            }
        }
        
        return null;
    }
    
    // 获取前缀意义
    getPrefixMeaning(prefix) {
        const meanings = {
            'un': '不',
            'dis': '非',
            're': '再',
            'pre': '前',
            'mis': '误',
            'over': '过',
            'under': '不足',
            'sub': '下',
            'super': '超',
            'inter': '间',
            'intra': '内',
            'trans': '跨'
        };
        return meanings[prefix] || '';
    }
    
    // 获取后缀意义
    getSuffixMeaning(suffix) {
        const meanings = {
            'ing': '中',
            'ed': '了',
            's': '们',
            'es': '们',
            'ly': '地',
            'ment': '',
            'ness': '性',
            'tion': '',
            'sion': '',
            'able': '可',
            'ible': '可',
            'al': '的',
            'ial': '的',
            'ful': '充满',
            'less': '无',
            'ize': '化',
            'ise': '化',
            'ity': '性',
            'ism': '主义',
            'ist': '家',
            'ance': '',
            'ence': '',
            'hood': '状态',
            'ship': '关系',
            'dom': '领域'
        };
        return meanings[suffix] || '';
    }
    
    // 查找相似词
    findSimilarWords(word) {
        const candidates = [];
        const threshold = 0.7;
        
        // 在长度相近的词中搜索
        const targetLength = word.length;
        const lengthRange = [Math.max(3, targetLength - 3), targetLength + 3];
        
        for (let len = lengthRange[0]; len <= lengthRange[1]; len++) {
            const wordsOfLength = ROOT_DATABASE[`length_${len}`] || [];
            
            for (const candidate of wordsOfLength) {
                const similarity = this.calculateSimilarity(word, candidate.english.toLowerCase());
                if (similarity >= threshold) {
                    candidates.push({
                        word: candidate,
                        similarity: similarity
                    });
                }
            }
        }
        
        if (candidates.length > 0) {
            // 按相似度排序
            candidates.sort((a, b) => b.similarity - a.similarity);
            
            return {
                confidence: candidates[0].similarity,
                result: candidates[0].word,
                suggestions: candidates.slice(1, 5).map(c => c.word)
            };
        }
        
        return null;
    }
    
    // 计算字符串相似度
    calculateSimilarity(str1, str2) {
        // 简单编辑距离算法（简化版）
        if (str1 === str2) return 1.0;
        if (str1.includes(str2) || str2.includes(str1)) return 0.9;
        
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        // 字符重叠率
        const set1 = new Set(str1);
        const set2 = new Set(str2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }
    
    // 分析复合词
    analyzeCompoundWord(word) {
        // 尝试分割复合词
        if (word.length < 6) return null;
        
        // 常见复合词模式
        const patterns = [
            /^(\w+)(graphy|logy|nomy|sophy|pathy|metry|scopy)$/i,
            /^(\w+)(able|ible|ful|less|ness|ment|tion|sion|ance|ence)$/i,
            /^(micro|macro|tele|hydro|psych|chron|geo|bio|astro|therm|photo)(\w+)$/i,
            /^(\w+)(proof|resistant|free|wise|like|worthy)$/i
        ];
        
        for (const pattern of patterns) {
            const match = word.match(pattern);
            if (match) {
                const parts = match.slice(1).filter(p => p.length >= 3);
                
                if (parts.length >= 2) {
                    // 尝试匹配每个部分
                    const decomposition = [];
                    let allMatched = true;
                    
                    for (const part of parts) {
                        const partMatch = this.directMatch(part);
                        if (partMatch) {
                            decomposition.push({
                                part: part,
                                type: 'component',
                                chinese: partMatch.chinese,
                                match: partMatch
                            });
                        } else {
                            allMatched = false;
                            break;
                        }
                    }
                    
                    if (allMatched && decomposition.length >= 2) {
                        // 组合中文翻译
                        const combinedChinese = decomposition.map(d => d.chinese).join('');
                        
                        return {
                            confidence: 0.75,
                            result: {
                                english: word,
                                chinese: combinedChinese,
                                pinyin: '',
                                category: 'Compound',
                                priority: 4,
                                compound: true
                            },
                            decomposition: decomposition
                        };
                    }
                }
            }
        }
        
        return null;
    }
}

// 初始化UI
function initUI() {
    // 初始化分析器
    window.analyzer = new IntelligentWordAnalyzer();
    
    // 绑定事件
    document.getElementById('analyze-btn').addEventListener('click', analyzeInput);
    document.getElementById('word-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') analyzeInput();
    });
    
    // 随机示例按钮
    document.getElementById('random-btn').addEventListener('click', showRandomExample);
    
    // 示例标签
    document.querySelectorAll('.example-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const word = tag.dataset.word;
            document.getElementById('word-input').value = word;
            analyzeInput();
        });
    });
    
    // 数据库搜索
    document.getElementById('search-db').addEventListener('input', filterDatabase);
    document.getElementById('category-filter').addEventListener('change', filterDatabase);
    
    // 标签页
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });
    
    console.log('UI初始化完成');
}

// 分析输入
async function analyzeInput() {
    const input = document.getElementById('word-input');
    const word = input.value.trim();
    
    if (!word) {
        alert('请输入英文单词');
        input.focus();
        return;
    }
    
    // 显示加载
    showLoading(true);
    
    // 分析单词
    const analysis = window.analyzer.analyze(word);
    
    // 显示结果
    displayAnalysis(analysis);
    
    // 隐藏加载
    showLoading(false);
}

// 显示分析结果
function displayAnalysis(analysis) {
    const resultDiv = document.getElementById('analysis-result');
    
    if (analysis.found) {
        const word = analysis.result;
        
        // 更新显示
        document.getElementById('english-word-display').textContent = analysis.original;
        document.getElementById('chinese-result-display').innerHTML = `
            <span class="chinese-characters">${word.chinese}</span>
            <span class="pinyin">${word.pinyin || ''}</span>
        `;
        
        document.getElementById('confidence-value').textContent = analysis.confidence.toFixed(2);
        document.getElementById('mapping-type').textContent = analysis.matchType.toUpperCase();
        
        // 更新详情
        document.getElementById('word-structure').textContent = 
            analysis.decomposition.length > 0 ? 
            analysis.decomposition.map(d => `${d.part}(${d.type})`).join(' + ') : 
            'Simple word';
        
        document.getElementById('morpheme-breakdown').textContent = 
            analysis.decomposition.length > 0 ?
            analysis.decomposition.map(d => d.chinese || d.part).join(' + ') :
            word.chinese;
        
        document.getElementById('semantic-category').textContent = word.category || 'General';
        document.getElementById('match-type').textContent = analysis.matchType;
        
        // 更新标签页
        updateEtymologyTab(analysis);
        updateSynonymsTab(word);
        updateExamplesTab(word);
        
    } else {
        // 未找到
        document.getElementById('english-word-display').textContent = analysis.original;
        document.getElementById('chinese-result-display').innerHTML = `
            <span class="chinese-characters">[未找到映射]</span>
            <span class="pinyin"></span>
        `;
        document.getElementById('confidence-value').textContent = '0.00';
        document.getElementById('mapping-type').textContent = 'NOT FOUND';
        
        // 显示建议
        if (analysis.suggestions.length > 0) {
            document.getElementById('morpheme-breakdown').textContent = 
                `建议: ${analysis.suggestions.slice(0, 3).map(w => w.english).join(', ')}`;
        }
    }
    
    // 动画效果
    resultDiv.classList.add('highlight');
    setTimeout(() => resultDiv.classList.remove('highlight'), 1000);
}

// 显示随机示例
function showRandomExample() {
    if (WORD_DATABASE.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * WORD_DATABASE.length);
    const randomWord = WORD_DATABASE[randomIndex].english;
    
    document.getElementById('word-input').value = randomWord;
    analyzeInput();
}

// 加载应用
window.addEventListener('DOMContentLoaded', initApp);