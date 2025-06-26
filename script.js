 // Configuración
        const API_BASE_URL = 'https://datasetsia.onrender.com'; // Reemplaza con tu URL
        //const API_BASE_URL = 'http://localhost:3001'; // Reemplaza con tu URL
        let emotionChart = null;

        const CATEGORIES = {
            positivo: ['alegría', 'felicidad', 'amor', 'gratitud', 'esperanza', 'calma'],
            negativo: ['tristeza', 'enojo', 'frustración', 'ansiedad', 'estrés', 'vergüenza', 'envidia', 'culpa','aburrimiento'],
            critico: ['suicida', 'autolesión', 'depresión_profunda', 'desesperación','psicopata'],
            neutral: ['neutral_genérico', 'neutral_hecho', 'neutral_robótico']
        };

        // Elementos del DOM
        const form = document.getElementById('contributionForm');
        const categorySelect = document.getElementById('categorySelect');
        const subEmotionSelect = document.getElementById('subEmotionSelect');
        const statsContainer = document.getElementById('statsContainer');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const submitText = document.getElementById('submitText');

        // Cargar categorías al iniciar
        function loadCategories() {
            for (const [category, subEmotions] of Object.entries(CATEGORIES)) {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                categorySelect.appendChild(option);
            }
        }

        // Actualizar subemociones al cambiar categoría
        categorySelect.addEventListener('change', function() {
            subEmotionSelect.disabled = !this.value;
            subEmotionSelect.innerHTML = '<option value="">Selecciona...</option>';
            
            if (this.value) {
                CATEGORIES[this.value].forEach(subEmotion => {
                    const option = document.createElement('option');
                    option.value = subEmotion;
                    option.textContent = subEmotion.replace('_', ' ').charAt(0).toUpperCase() + 
                                       subEmotion.replace('_', ' ').slice(1);
                    subEmotionSelect.appendChild(option);
                });
            }
        });

        // Enviar datos a la API
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const contribution = {
                texto: document.getElementById('textInput').value,
                emocion: subEmotionSelect.value,
                grupo: categorySelect.value,
                autor: document.getElementById('authorInput').value
            };

            try {
                // Mostrar loading
                loadingSpinner.style.display = 'inline-block';
                submitText.textContent = 'Enviando...';
                
                const response = await fetch(`${API_BASE_URL}/api/contribuciones`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(contribution)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                alert('✅ Contribución enviada con éxito!');
                form.reset();
                loadStats();
            } catch (error) {
                console.error('Error:', error);
                alert(`❌ Error al enviar: ${error.message}`);
            } finally {
                loadingSpinner.style.display = 'none';
                submitText.textContent = 'Enviar Contribución';
            }
        });

       // Configuración
const POLL_INTERVAL = 10000; // 10 segundos
let failedAttempts = 0;
let isFetching = false;

// Función mejorada para cargar estadísticas
async function loadStats() {
    if (isFetching) return;
    isFetching = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/estadisticas`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const { data, cached } = await response.json();
        failedAttempts = 0; // Resetear contador de errores
        
        renderStats(data);
        
        // Ajustar intervalo dinámico basado en si fue caché
        const nextPoll = cached ? POLL_INTERVAL * 1.6 : POLL_INTERVAL;
        setTimeout(loadStats, nextPoll);
    } catch (error) {
        console.error("Error fetching stats:", error);
        failedAttempts++;
        
        // Backoff exponencial en errores
        const retryDelay = Math.min(1000 * 2 ** failedAttempts, 60000);
        setTimeout(loadStats, retryDelay);
        
        showError(`Error actualizando (intento ${failedAttempts}): ${error.message}`);
    } finally {
        isFetching = false;
    }
}
async function loadRankingAutores() {
  try {
    const response = await fetch(`${API_BASE_URL}/ranking-autores`);
    const result = await response.json();

    if (!result.success || !result.data) return;

    const list = document.getElementById("rankingList");
    if (!list) return;

    list.innerHTML = '';

    if (result.data.length === 0) {
      list.innerHTML = '<li class="list-group-item text-center">Aún no hay contribuciones</li>';
      return;
    }

    result.data.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'list-group-item ranking-item d-flex justify-content-between align-items-center';
      
      const medalEmoji = ['🥇', '🥈', '🥉'][index] || '';
      const medalSpan = document.createElement('span');
      medalSpan.className = 'medal';
      medalSpan.textContent = medalEmoji;
      
      const nameSpan = document.createElement('span');
      nameSpan.innerHTML = `<strong>${item._id}</strong>`;
      
      const badgeSpan = document.createElement('span');
      badgeSpan.className = 'badge bg-success rounded-pill contributions-badge';
      badgeSpan.textContent = `${item.count} ${item.count === 1 ? 'contribución' : 'contribuciones'}`;
      
      const leftDiv = document.createElement('div');
      leftDiv.className = 'd-flex align-items-center';
      leftDiv.appendChild(medalSpan);
      leftDiv.appendChild(nameSpan);
      
      li.appendChild(leftDiv);
      li.appendChild(badgeSpan);
      
      list.appendChild(li);
    });
  } catch (error) {
    console.error("Error al cargar el ranking de autores:", error);
    list.innerHTML = '<li class="list-group-item text-center text-danger">Error cargando el ranking</li>';
  }
}

// Modificar el event listener del DOM para que solo muestre el ranking
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadRankingAutores(); // Solo cargar el ranking
    
    // Opcional: Actualizar el ranking periódicamente
    setInterval(loadRankingAutores, POLL_INTERVAL);
});

// Renderizado optimizado
function renderStats(stats) {
    const statsContainer = document.getElementById('statsContainer');
    
    // Usar fragmento de documento para minimizar reflows
    const fragment = document.createDocumentFragment();
    
    // Card de Total
    const totalCard = createStatCard(
        "Total Contribuciones", 
        stats.total, 
        "bg-primary"
    );
    fragment.appendChild(totalCard);
    
    // Cards por Categoría
    for (const [categoria, count] of Object.entries(stats.porCategoria)) {
        const card = createStatCard(
            `Categoría ${categoria}`,
            count,
            getCategoryColor(categoria)
        );
        fragment.appendChild(card);
    }
    
    // Lista de últimas contribuciones
    const lastContribs = document.createElement('div');
    lastContribs.className = 'col-12 mt-4';
    lastContribs.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">Últimas 5 Contribuciones</h5>
                <ul class="list-group list-group-flush">
                    ${stats.ultimas.map(item => `
                        <li class="list-group-item d-flex justify-content-between align-items-start">
                            <div>
                                <strong>${item.autor}</strong>
                                <div class="text-muted small">${formatDate(item.createdAt)}</div>
                                <div>"${item.texto}"</div>
                            </div>
                            <span class="badge ${getEmotionBadgeClass(item.emocion)}">
                                ${item.emocion}
                            </span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;
    fragment.appendChild(lastContribs);
    


document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadStats();
    loadEmotionStats();
    loadRankingAutores();

    setInterval(() => {
        loadStats();            // actualiza estadísticas
        loadEmotionStats();     // actualiza gráfica
        loadRankingAutores();   // actualiza ranking
    }, POLL_INTERVAL);
});

    // Actualizar el DOM una sola vez
    statsContainer.innerHTML = '';
    statsContainer.appendChild(fragment);
}

// Helper functions
function createStatCard(title, value, bgClass) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-3';
    col.innerHTML = `
        <div class="card h-100">
            <div class="card-body text-center">
                <h5 class="card-title">${title}</h5>
                <div class="display-4 ${bgClass} text-white p-3 rounded">
                    ${value}
                </div>
            </div>
        </div>
    `;
    return col;
}

function getCategoryColor(categoria) {
    const colors = {
        positivo: 'bg-success',
        negativo: 'bg-warning',
        critico: 'bg-danger',
        neutral: 'bg-secondary'
    };
    return colors[categoria] || 'bg-info';
}

function getEmotionBadgeClass(emocion) {
    // Mapeo de emociones a colores
    const emotionColors = {
        alegría: 'bg-success',
        tristeza: 'bg-primary',
        enojo: 'bg-warning text-dark',
        // Agrega más mapeos según necesites
    };
    return emotionColors[emocion] || 'bg-secondary';
}

function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Iniciar polling
document.addEventListener('DOMContentLoaded', () => {
    loadStats(); // Carga inicial
    
    // Opcional: Recargar al ganar foco (si la pestaña estuvo inactiva)
    window.addEventListener('focus', loadStats);
});

        // Inicialización
        document.addEventListener('DOMContentLoaded', () => {
            loadCategories();
            loadStats();
        });