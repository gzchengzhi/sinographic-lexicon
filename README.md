# Sinographic Integration

An intelligent web application for mapping English words to Chinese characters through morphological decomposition and semantic analysis.

## Features

- **Smart Word Analysis**: Decomposes English words into morphemes and identifies classical roots
- **Multi-strategy Matching**: Uses direct, lemma-based, synonym-based, and fuzzy matching
- **Visual Mapping Display**: Shows English → Chinese mapping with confidence scores
- **Etymology Analysis**: Displays classical root breakdown (Latin/Greek origins)
- **Interactive Database**: Browse and search 1,500+ English-Chinese mappings
- **Responsive Design**: Works on desktop and mobile devices

## Live Demo

Visit the live demo at: [https://yourusername.github.io/sinographic-integration/](https://yourusername.github.io/sinographic-integration/)

## How to Use

1. **Enter an English word** in the search box (e.g., "photography", "democracy")
2. **Click "Analyze & Map"** or press Enter
3. **View the results**:
   - Chinese character mapping
   - Confidence score
   - Word structure analysis
   - Etymology breakdown
   - Related synonyms
   - Usage examples

## Technical Implementation

### Core Algorithms

1. **Morpheme Decomposition**:
   - WordNet lemmatization
   - Prefix/suffix stripping
   - Classical root identification
   - Compound word segmentation

2. **Matching Strategies**:
   - Direct matching (100% confidence)
   - Lemma-based matching (90% confidence)
   - Synonym-based matching (85% confidence)
   - Fuzzy matching (60-80% confidence)

3. **Classical Root Detection**:
   - Latin roots: bio, geo, tele, micro, etc.
   - Greek roots: graph, phon, logy, cracy, etc.
   - Root meaning mapping to Chinese characters

### Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Data Format**: JSON for mapping database
- **Styling**: CSS Grid, Flexbox, CSS Variables
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Inter, Noto Sans SC)
- **Hosting**: GitHub Pages

## Project Structure
