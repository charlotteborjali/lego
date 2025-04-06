'use strict';

/**
Description of the available api
GET https://lego-api-blue.vercel.app/deals

Search for specific deals

This endpoint accepts the following optional query string parameters:

- page - page of deals to return
- size - number of deals to return

GET https://lego-api-blue.vercel.app/sales

Search for current Vinted sales for a given lego set id

This endpoint accepts the following optional query string parameters:

- id - lego set id to return
*/

// current deals on the page
let currentDeals = [];
let currentPagination = {};
let favorites = new Set();

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals = document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');
const spanNbSales = document.querySelector('#nbSales');
const filters = document.querySelector('#filters');
const selectSort = document.querySelector('#sort-select');
const indicators = document.querySelector('#indicators');
const favoritesFilter = document.querySelector('#favorites-filter');

/**
 * Set global value
 * @param {Object} data - Contient les propriétés result et meta
 */
const setCurrentDeals = (data) => {
  if (data && data.data && Array.isArray(data.data.result)) {
    currentDeals = data.data.result;  // Utilise 'result' pour récupérer les deals
    currentPagination = data.data.meta || {};  // Utilise 'meta' pour la pagination
  } else {
    console.error('Invalid data structure in setCurrentDeals', data);
    currentDeals = [];
    currentPagination = {};
  }
};

/**
 * Fetch deals from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=6] - size of the page
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
    );

    if (!response.ok) {
      throw new Error(`API response error: ${response.status}`);
    }

    const body = await response.json();
    
    // Afficher la réponse dans la console pour mieux comprendre son format
    console.log("Fetched data:", body); // <-- Cette ligne affiche la réponse complète dans la console

    if (body.success !== true) {
      console.error('API returned success: false', body);
      return { data: [], meta: {} };
    }

    // Retourner les données
    return { data: body.data || [], meta: body.meta || {} };
  } catch (error) {
    console.error('Error fetching deals:', error);
    return { data: [], meta: {} };
  }
};
const fetchSales = async (id, page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/sales?id=${id}&page=${page}&size=${size}`
    );

    if (!response.ok) {
      throw new Error(`API response error: ${response.status}`);
    }

    const body = await response.json();

    // Afficher la réponse dans la console pour mieux comprendre son format
    console.log("Fetched sales data:", body); // <-- Cette ligne affiche la réponse complète dans la console

    if (body.success !== true) {
      console.error('API returned success: false', body);
      return { data: [], meta: {} };
    }

    // Retourner les données
    return { data: body.data || [], meta: body.meta || {} };
  } catch (error) {
    console.error('Error fetching sales:', error);
    return { data: [], meta: {} };
  }
};
/**
 * Fetch sales data for a specific Lego set ID
 * @param {String} id - Lego set ID
 * @return {Array} - Array of sales data
 */


/**
 * Format and validate the date
 */
const formatDate = (date) => {
  if (typeof date === 'string' && date.includes('GMT')) {
    // Date de Vinted, format : "Sat, 18 Jan 2025 16:19:10 GMT"
    return new Date(date);
  } else if (typeof date === 'number') {
    // Date de Dealabs, c'est un timestamp Unix
    return new Date(date * 1000); // Convertir en millisecondes
  }
  return null; // Retourne null si la date est dans un format non supporté
};

/**
 * Render list of deals
 * @param {Array} deals - Array of deals to render
 */
const renderDeals = (deals) => {
  if (!Array.isArray(deals)) {
    console.error('Deals is not an array', deals);
    sectionDeals.innerHTML = '<h2>No deals available</h2>';
    return;
  }

  const fragment = document.createDocumentFragment();
  const dealsContainer = document.createElement('div');
  dealsContainer.className = 'deals-container';

  deals.forEach(deal => {
    const div = document.createElement('div');
    div.classList.add('deal');
    div.id = deal.uuid;

    // Format de la date
    const dealDate = formatDate(deal.published); // On prend la date "published" pour Dealabs ou Vinted

    // Ajout de la classe favorite si ce deal est dans les favoris
    if (favorites.has(deal.uuid)) {
      div.classList.add('favorite');
    }

    div.innerHTML = `
      <div class="deal-header">
        <span class="deal-id">${deal.id}</span>
        <button class="favorite-btn" data-id="${deal.uuid}">
          ${favorites.has(deal.uuid) ? '★' : '☆'}
        </button>
      </div>
      <a href="${deal.link}" target="_blank" class="deal-title">${deal.title}</a>
      <div class="deal-info">
        <span class="deal-price">${deal.price} €</span>
        <span class="deal-discount">${deal.discount || 0}% off</span>
        <span class="deal-temp">🔥 ${deal.temperature || 0}</span>
        <span class="deal-comments">💬 ${deal.comments || 0}</span>
        <span class="deal-date">📅 ${dealDate ? dealDate.toLocaleDateString() : 'Invalid Date'}</span>
      </div>
    `;

    // Ajouter un événement au bouton Favori
    const favoriteBtn = div.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = e.target.dataset.id;
      if (favorites.has(id)) {
        favorites.delete(id);
        e.target.textContent = '☆';
        div.classList.remove('favorite');
      } else {
        favorites.add(id);
        e.target.textContent = '★';
        div.classList.add('favorite');
      }
      // Si le filtre par favoris est actif, réappliquez les filtres
      if (favoritesFilter && favoritesFilter.classList.contains('active')) {
        applyFilters();
      }
    });

    dealsContainer.appendChild(div);
  });

  fragment.appendChild(dealsContainer);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);
};

const renderSales = (sales) => {
  if (!Array.isArray(sales)) {
    console.error('Sales is not an array', sales);
    sectionSales.innerHTML = '<h2>No sales available</h2>';
    return;
  }

  const fragment = document.createDocumentFragment();
  const salesContainer = document.createElement('div');
  salesContainer.className = 'sales-container';

  sales.forEach(sale => {
    const div = document.createElement('div');
    div.classList.add('sale');
    div.id = sale.uuid;

    // Format de la date
    const saleDate = formatDate(sale.published); // On prend la date "published" pour les ventes Vinted

    // Ajout de la classe favorite si cette vente est dans les favoris
    if (favorites.has(sale.uuid)) {
      div.classList.add('favorite');
    }

    div.innerHTML = `
      <div class="sale-header">
        <span class="sale-id">${sale.id}</span>
        <button class="favorite-btn" data-id="${sale.uuid}">
          ${favorites.has(sale.uuid) ? '★' : '☆'}
        </button>
      </div>
      <a href="${sale.link}" target="_blank" class="sale-title">${sale.title}</a>
      <div class="sale-info">
        <span class="sale-price">${sale.price} €</span>
        <span class="sale-discount">${sale.discount || 0}% off</span>
        <span class="sale-temp">🔥 ${sale.temperature || 0}</span>
        <span class="sale-comments">💬 ${sale.comments || 0}</span>
        <span class="sale-date">📅 ${saleDate ? saleDate.toLocaleDateString() : 'Invalid Date'}</span>
      </div>
    `;

    // Ajouter un événement au bouton Favori
    const favoriteBtn = div.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = e.target.dataset.id;
      if (favorites.has(id)) {
        favorites.delete(id);
        e.target.textContent = '☆';
        div.classList.remove('favorite');
      } else {
        favorites.add(id);
        e.target.textContent = '★';
        div.classList.add('favorite');
      }
      // Si le filtre par favoris est actif, réappliquez les filtres
      if (favoritesFilter && favoritesFilter.classList.contains('active')) {
        applyFilters();
      }
    });

    salesContainer.appendChild(div);
  });

  fragment.appendChild(salesContainer);
  sectionSales.innerHTML = '<h2>Vinted Sales</h2>';
  sectionSales.appendChild(fragment);
};


/**
 * Render pagination controls
 * @param {Object} pagination - Pagination metadata
 */
const renderPagination = (pagination) => {
  if (!pagination || !pagination.currentPage || !pagination.pageCount) {
    console.error('Invalid pagination data:', pagination);
    selectPage.innerHTML = '<option value="1">1</option>';
    return;
  }

  const { currentPage, pageCount } = pagination;
  
  // Créer des options pour les pages
  selectPage.innerHTML = '';
  for (let i = 1; i <= pageCount; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    selectPage.appendChild(option);
  }
  
  selectPage.value = currentPage;
};

/**
 * Render Lego set ID dropdown
 * @param {Array} deals - Array of deals to extract IDs from
 */
const renderLegoSetIds = (deals) => {
  if (!Array.isArray(deals) || deals.length === 0) {
    selectLegoSetIds.innerHTML = '<option value="">No sets available</option>';
    return;
  }
  
  // Extract unique IDs
  const ids = [...new Set(deals.map(deal => deal.id))];
  
  selectLegoSetIds.innerHTML = '';
  ids.forEach(id => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = id;
    selectLegoSetIds.appendChild(option);
  });
};

/**
 * Calculate and render indicators for a specific Lego set ID
 * @param {String} id - Lego set ID
 */
const renderIndicators = pagination => {
  const {count} = pagination;

  spanNbDeals.innerHTML = count;
};


/**
 * Apply all filters and sort to the deals
 */
const applyFilters = () => {
  if (!Array.isArray(currentDeals) && !Array.isArray(currentSales)) {
    console.error('currentDeals and currentSales are not arrays in applyFilters');
    return;
  }

  let filtered = [];

  // Si on travaille avec des deals
  if (Array.isArray(currentDeals)) {
    filtered = [...currentDeals];

    // Apply category filters for deals
    const activeFilter = filters.querySelector('.active');
    if (activeFilter) {
      const filterText = activeFilter.textContent;

      if (filterText === 'By best discount') {
        filtered = filtered.filter(d => d.discount >= 50);
      } else if (filterText === 'By most commented') {
        filtered = filtered.filter(d => d.comments >= 15);
      } else if (filterText === 'By hot deals') {
        filtered = filtered.filter(d => d.temperature >= 100);
      }
    }

    // Apply favorites filter (if active)
    if (favoritesFilter && favoritesFilter.classList.contains('active')) {
      filtered = filtered.filter(d => favorites.has(d.uuid));
    }

    // Apply sorting
    const sortValue = selectSort.value;

    if (sortValue === 'price-asc') {
      filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortValue === 'price-desc') {
      filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (sortValue === 'date-asc') {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortValue === 'date-desc') {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortValue === 'favorites') {
      // Tri par favoris (les favoris en premier)
      filtered.sort((a, b) => {
        const aIsFavorite = favorites.has(a.uuid) ? 1 : 0;
        const bIsFavorite = favorites.has(b.uuid) ? 1 : 0;
        return bIsFavorite - aIsFavorite; // Trie les favoris en premier
      });
    }

    // Render the filtered deals
    renderDeals(filtered);
  }

  // Si on travaille avec des sales (Vinted)
  else if (Array.isArray(currentSales)) {
    filtered = [...currentSales];

    // Apply category filters for sales (e.g., based on price or comments)
    const activeFilter = filters.querySelector('.active');
    if (activeFilter) {
      const filterText = activeFilter.textContent;

      if (filterText === 'By best discount') {
        filtered = filtered.filter(s => s.discount >= 50);
      } else if (filterText === 'By most commented') {
        filtered = filtered.filter(s => s.comments >= 15);
      } else if (filterText === 'By hot deals') {
        filtered = filtered.filter(s => s.temperature >= 100);
      }
    }

    // Apply favorites filter (if active)
    if (favoritesFilter && favoritesFilter.classList.contains('active')) {
      filtered = filtered.filter(s => favorites.has(s.uuid));
    }

    // Apply sorting for sales
    const sortValue = selectSort.value;

    if (sortValue === 'price-asc') {
      filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortValue === 'price-desc') {
      filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (sortValue === 'date-asc') {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortValue === 'date-desc') {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortValue === 'favorites') {
      // Tri par favoris (les favoris en premier)
      filtered.sort((a, b) => {
        const aIsFavorite = favorites.has(a.uuid) ? 1 : 0;
        const bIsFavorite = favorites.has(b.uuid) ? 1 : 0;
        return bIsFavorite - aIsFavorite; // Trie les favoris en premier
      });
    }

    // Render the filtered sales
    renderSales(filtered);
  }
};


/**
 * Render all components
 * @param {Array} deals - Array of deals
 * @param {Object} pagination - Pagination metadata
 */
const render = (data, pagination) => {
  if (Array.isArray(data)) {
    if (data.length > 0 && data[0]?.uuid) {
      // Si ce sont des deals
      renderDeals(data);
    } else {
      // Si ce sont des sales (Vinted)
      renderSales(data);
    }
  }

  renderPagination(pagination);

  // Si on a des deals, on affiche les Lego Set Ids et les indicateurs
  if (Array.isArray(data) && data.length > 0 && data[0]?.uuid) {
    renderLegoSetIds(data);
    renderIndicators(data[0]?.id || '');
  }
  
  // Update deal count
  spanNbDeals.textContent = pagination?.count || (Array.isArray(data) ? data.length : 0);
};


// Event Listeners

// Page selector change
selectPage.addEventListener('change', async (e) => {
  const page = parseInt(e.target.value);
  const size = parseInt(selectShow.value || 6);
  const id = selectLegoSetIds.value;  // Récupérer l'ID du set Lego sélectionné

  if (id) {
    // Si un ID de set Lego est sélectionné, on récupère les ventes de ce set
    const salesData = await fetchSales(page, size);
    setCurrentSales(salesData);  // Assure-toi que tu as une fonction pour stocker les sales
    renderSales(currentSales, currentPagination);
  } else {
    // Sinon, on récupère les deals
    const dealsData = await fetchDeals(page, size);
    setCurrentDeals(dealsData);
    render(currentDeals, currentPagination);
  }
});

// Show more selector change
selectShow.addEventListener('change', async (e) => {
  const size = parseInt(e.target.value);
  const page = parseInt(selectPage.value || 1);
  const id = selectLegoSetIds.value;  // Récupérer l'ID du set Lego sélectionné
  
  // Récupérer les deals
  const dealsData = await fetchDeals(page, size);
  setCurrentDeals(dealsData);
  renderDeals(currentDeals, currentPagination);

  // Récupérer les ventes de Vinted si un ID est sélectionné
  if (id) {
    const salesData = await fetchSales(page, size);
    setCurrentSales(salesData);  // Assure-toi d'avoir une fonction pour stocker les sales
    renderSales(currentSales, currentPagination);
  } else {
    // Si aucun ID de set Lego n'est sélectionné, afficher un message ou laisser la section vide
    sectionSales.innerHTML = '<h2>No Vinted sales available</h2>';
  }
});

// Sort selector change
selectSort.addEventListener('change', applyFilters);

// Category filters click
filters.addEventListener('click', e => {
  if (e.target.tagName === 'SPAN') {
    // Toggle filter if it's already active
    if (e.target.classList.contains('active')) {
      e.target.classList.remove('active');
    } else {
      // Remove active class from all filters
      filters.querySelectorAll('span').forEach(s => s.classList.remove('active'));
      // Add active class to clicked filter
      e.target.classList.add('active');
    }
    applyFilters();
  }
});

// Favorites filter click
if (favoritesFilter) {
  favoritesFilter.addEventListener('click', () => {
    favoritesFilter.classList.toggle('active');
    applyFilters();
  });
}

// Lego set ID selector change
selectLegoSetIds.addEventListener('change', async (e) => {
  await renderIndicators(e.target.value);
});



document.addEventListener('DOMContentLoaded', async () => {
  try {
    const dealsData = await fetchDeals(1, parseInt(selectShow.value || 6));
    
    // Vérification de la validité de currentDeals
    if (Array.isArray(dealsData.data.result) && dealsData.data.result.length > 0) {
      setCurrentDeals(dealsData);  // Mettre à jour les données globales
      render(currentDeals, currentPagination);
    } else {
      console.error('Invalid deals data:', dealsData);
      sectionDeals.innerHTML = '<h2>No deals available</h2>';
    }
  } catch (error) {
    console.error('Error during initialization:', error);
    sectionDeals.innerHTML = '<h2>Error loading deals</h2>';
  }
});
