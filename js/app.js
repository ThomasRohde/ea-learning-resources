// Global variables
let catalogueData = [];
let currentResults = [];
let filters = {
    category: '',
    type: '',
    careerLevel: ''
};

// DOM Elements
let resourcesContainer;
let noResults;
let totalResources;
let totalCategories;
let totalResultsElement;
let searchInput;
let searchButton;
let categoryFilter;
let typeFilter;
let careerLevelFilter;
let applyFiltersButton;
let clearFiltersButton;
let activeFilters;
let loadingContainer;
let darkModeToggle;
let fuse;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM element references
    resourcesContainer = document.getElementById('resourcesContainer');
    noResults = document.getElementById('noResults');
    totalResources = document.getElementById('totalResources');
    totalCategories = document.getElementById('totalCategories');
    totalResultsElement = document.getElementById('totalResults');
    searchInput = document.getElementById('searchInput');
    searchButton = document.getElementById('searchButton');
    categoryFilter = document.getElementById('categoryFilter');
    typeFilter = document.getElementById('typeFilter');
    careerLevelFilter = document.getElementById('careerLevelFilter');
    applyFiltersButton = document.getElementById('applyFiltersButton');
    clearFiltersButton = document.getElementById('clearFiltersButton');
    activeFilters = document.getElementById('activeFilters');
    loadingContainer = document.getElementById('loadingContainer');
    darkModeToggle = document.getElementById('darkModeToggle');
    
    // Load the JSON data
    loadCatalogueData();
});

// Load JSON data from external file
function loadCatalogueData() {    // Show loading indicator
    if (loadingContainer) {
        loadingContainer.classList.remove('d-none');
    }
    
    fetch('resources.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format: expected an array');
            }
            
            catalogueData = data;
            console.log(`Successfully loaded ${catalogueData.length} resources`);
            
            // Set up Fuse.js with options for fuzzy searching
            const fuseOptions = {
                keys: ['title', 'description', 'category', 'type', 'source'],
                threshold: 0.3,
                includeScore: true
            };
            fuse = new Fuse(catalogueData, fuseOptions);
            
            // Initialize the app
            populateFilters();
            updateStats();
            searchResources();
            setupEventListeners();
            checkDarkModePreference();
              // Hide loading indicator
            if (loadingContainer) {
                loadingContainer.classList.add('d-none');
            }
        })
        .catch(error => {
            console.error('Error loading catalogue data:', error);
            if (loadingContainer) {
                loadingContainer.innerHTML = `<div class="alert alert-danger">
                    <h4>Failed to load resources</h4>
                    <p>${error.message}</p>
                    <p>Check that resources.json is valid JSON and accessible.</p>
                </div>`;
            }
        });
}

// Populate filter dropdowns
function populateFilters() {
    const categories = [...new Set(catalogueData.map(item => item.category))];
    const types = [...new Set(catalogueData.map(item => item.type))];

    categories.sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });

    types.sort().forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeFilter.appendChild(option);
    });
}

// Set up event listeners
function setupEventListeners() {
    searchButton.addEventListener('click', () => searchResources());
    
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchResources();
        }
    });

    applyFiltersButton.addEventListener('click', () => {
        filters.category = categoryFilter.value;
        filters.type = typeFilter.value;
        filters.careerLevel = careerLevelFilter.value;
        updateActiveFilters();
        searchResources();
    });

    clearFiltersButton.addEventListener('click', () => {
        categoryFilter.value = '';
        typeFilter.value = '';
        careerLevelFilter.value = '';
        searchInput.value = '';
        filters = {
            category: '',
            type: '',
            careerLevel: ''
        };
        updateActiveFilters();
        searchResources();
    });

    darkModeToggle.addEventListener('click', toggleDarkMode);
}

// Update statistics
function updateStats() {
    if (totalResources) {
        totalResources.textContent = catalogueData.length;
    }
    
    if (totalCategories) {
        const uniqueCategories = [...new Set(catalogueData.map(item => item.category))];
        totalCategories.textContent = uniqueCategories.length;
    }
}

// Search resources based on filters and search term
function searchResources() {
    const searchTerm = searchInput.value.trim();
    
    // First apply the search term if exists
    let results = searchTerm ? 
        fuse.search(searchTerm).map(result => result.item) : 
        [...catalogueData];
    
    // Then apply filters
    if (filters.category) {
        results = results.filter(item => item.category === filters.category);
    }
    
    if (filters.type) {
        results = results.filter(item => item.type === filters.type);
    }
    
    if (filters.careerLevel) {
        results = results.filter(item => 
            item.recommended_career_levels && 
            item.recommended_career_levels.includes(filters.careerLevel)
        );
    }
    
    currentResults = results;
    renderResults(results);
}

// Render search results
function renderResults(results) {
    resourcesContainer.innerHTML = '';
    
    if (results.length === 0) {
        noResults.classList.remove('d-none');
    } else {
        noResults.classList.add('d-none');
        
        results.forEach(resource => {
            const card = createResourceCard(resource);
            resourcesContainer.appendChild(card);
        });
    }
    
    if (totalResultsElement) {
        totalResultsElement.textContent = results.length;
    }
    
    updateActiveFilters();
}

// Create a resource card
function createResourceCard(resource) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';
    
    const card = document.createElement('div');
    card.className = 'card h-100';
    
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    cardHeader.textContent = resource.category;
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    // Highlight search terms in title and description
    let title = resource.title;
    let description = resource.description;
    
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
        const terms = searchTerm.split(/\s+/);
        terms.forEach(term => {
            if (term.length > 2) { // Only highlight terms with more than 2 chars
                const regex = new RegExp(`(${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
                title = title.replace(regex, '<span class="highlight">$1</span>');
                description = description.replace(regex, '<span class="highlight">$1</span>');
            }
        });
    }
    
    const cardTitle = document.createElement('h5');
    cardTitle.className = 'card-title';
    cardTitle.innerHTML = title;
    
    const typeBadge = document.createElement('span');
    typeBadge.className = 'badge bg-primary badge-type mb-2';
    typeBadge.textContent = resource.type;
    
    const cardText = document.createElement('p');
    cardText.className = 'card-text';
    cardText.innerHTML = description;
    
    const careerLevelsDiv = document.createElement('div');
    careerLevelsDiv.className = 'mt-2';
    
    if (resource.recommended_career_levels && resource.recommended_career_levels.length > 0) {
        resource.recommended_career_levels.forEach(level => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-secondary badge-career';
            badge.textContent = level;
            careerLevelsDiv.appendChild(badge);
            careerLevelsDiv.appendChild(document.createTextNode(' '));
        });
    }
    
    const sourceDiv = document.createElement('div');
    sourceDiv.className = 'mt-2 source-tag';
    if (resource.source) {
        sourceDiv.textContent = `Source: ${resource.source}`;
    }
    
    const linkDiv = document.createElement('div');
    linkDiv.className = 'mt-3';
    
    const link = document.createElement('a');
    link.href = resource.link;
    link.className = 'card-link';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.innerHTML = `Visit Resource <i class="bi bi-box-arrow-up-right"></i>`;
    
    linkDiv.appendChild(link);
    
    cardBody.appendChild(cardTitle);
    cardBody.appendChild(typeBadge);
    cardBody.appendChild(cardText);
    cardBody.appendChild(careerLevelsDiv);
    cardBody.appendChild(sourceDiv);
    cardBody.appendChild(linkDiv);
    
    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    
    col.appendChild(card);
    
    return col;
}

// Update active filters display
function updateActiveFilters() {
    activeFilters.innerHTML = '';
    
    const searchTerm = searchInput.value.trim();
    const filtersApplied = Object.values(filters).some(value => value !== '') || searchTerm !== '';
    
    if (!filtersApplied) {
    activeFilters.classList.add('d-none');
    return;
    }
    
    activeFilters.classList.remove('d-none');
    
    if (searchTerm) {
        createFilterTag('Search', searchTerm);
    }
    
    if (filters.category) {
        createFilterTag('Category', filters.category);
    }
    
    if (filters.type) {
        createFilterTag('Type', filters.type);
    }
    
    if (filters.careerLevel) {
        createFilterTag('Career Level', filters.careerLevel);
    }
}

// Create a filter tag
function createFilterTag(name, value) {
    const tag = document.createElement('div');
    tag.className = 'filter-tag';
    tag.innerHTML = `${name}: ${value} <span class="remove-tag" data-filter="${name.toLowerCase()}">&times;</span>`;
    
    const removeBtn = tag.querySelector('.remove-tag');
    removeBtn.addEventListener('click', () => {
        const filterName = removeBtn.getAttribute('data-filter');
        
        if (filterName === 'category') {
            filters.category = '';
            categoryFilter.value = '';
        } else if (filterName === 'type') {
            filters.type = '';
            typeFilter.value = '';
        } else if (filterName === 'career' || filterName === 'career level') {
            filters.careerLevel = '';
            careerLevelFilter.value = '';
        } else if (filterName === 'search') {
            searchInput.value = '';
        }
        
        updateActiveFilters();
        searchResources();
    });
    
    activeFilters.appendChild(tag);
}

// Dark mode functionality
function checkDarkModePreference() {
    const darkModeEnabled = localStorage.getItem('darkModeEnabled') === 'true';
    
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="bi bi-sun"></i> Light Mode';
    } else {
        document.body.classList.remove('dark-mode');
        darkModeToggle.innerHTML = '<i class="bi bi-moon"></i> Dark Mode';
    }
}

function toggleDarkMode() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    if (isDarkMode) {
        document.body.classList.remove('dark-mode');
        darkModeToggle.innerHTML = '<i class="bi bi-moon"></i> Dark Mode';
        localStorage.setItem('darkModeEnabled', 'false');
    } else {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="bi bi-sun"></i> Light Mode';
        localStorage.setItem('darkModeEnabled', 'true');
    }
}
