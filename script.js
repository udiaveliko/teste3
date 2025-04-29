document.addEventListener("DOMContentLoaded", () => {
    const parkSelect = document.getElementById("park-select");
    const parkNameDisplay = document.getElementById("park-name");
    const currentTimeDisplay = document.getElementById("current-time");
    const attractionsList = document.getElementById("attractions-list");
    const errorDisplay = document.getElementById("error-message");
    const loadingMessage = document.getElementById("loading-message");

    let updateInterval;

    // Função para gerar URL de imagem placeholder para atrações
    function getAttractionImageUrl(attractionName, parkName) {
        const hash = Math.abs(attractionName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100);
        return `https://via.placeholder.com/60/${hash.toString(16)}00/${(100-hash).toString(16)}00?text=${encodeURIComponent(attractionName.charAt(0))}`;
    }

    async function fetchWaitTimes(parkName) {
        errorDisplay.textContent = "";
        loadingMessage.style.display = "block";
        attractionsList.innerHTML = "";
        parkNameDisplay.textContent = parkName;
        currentTimeDisplay.textContent = "--:--:--";

        try {
            const response = await fetch(`/api/waittimes?park=${encodeURIComponent(parkName)}`);
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { details: await response.text() || response.statusText };
                }
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || errorData.details}`);
            }
            const data = await response.json();

            parkNameDisplay.textContent = data.parkName;
            currentTimeDisplay.textContent = data.currentTime;
            loadingMessage.style.display = "none";

            if (data.attractions && data.attractions.length > 0) {
                data.attractions.forEach(attraction => {
                    const attractionCard = document.createElement("div");
                    attractionCard.className = "attraction-card";

                    const isOperating = attraction.status && (attraction.status.toLowerCase() === "operating" || attraction.status.toLowerCase() === "opened");

                    // REMOVIDO: Lógica de menor tempo do dia
                    // const isLowestTime = attraction.isLowestTime;

                    let waitTimeHTML = "";
                    const waitTimeClass = "wait-time-container"; // Classe padrão

                    // REMOVIDO: Adição da classe .lowest
                    // if (isLowestTime) {
                    //     waitTimeClass += " lowest";
                    // }

                    if (isOperating && attraction.waitTime !== null && attraction.waitTime !== undefined) {
                        waitTimeHTML = `
                            <div class="${waitTimeClass}">
                                <span class="minutes">${attraction.waitTime} min</span>
                                <!-- REMOVIDO: Indicador de menor tempo -->
                            </div>
                        `;
                    } else if (isOperating) {
                        waitTimeHTML = `
                            <div class="${waitTimeClass}">
                                <span class="status-operating">Aberto</span>
                            </div>
                        `;
                    } else {
                        waitTimeHTML = `
                            <div class="${waitTimeClass}">
                                <span class="status-closed">Fechado</span>
                            </div>
                        `;
                    }

                    attractionCard.innerHTML = `
                        <img src="${getAttractionImageUrl(attraction.name, parkName)}" class="attraction-image" alt="${attraction.name}">
                        <div class="attraction-info">
                            <h2 class="attraction-name">${attraction.name}</h2>
                            <p class="park-name">${parkName}</p>
                        </div>
                        ${waitTimeHTML}
                    `;

                    attractionsList.appendChild(attractionCard);
                });
            } else {
                attractionsList.innerHTML = "<div class=\'error-message\'>Nenhuma atração encontrada ou parque fechado.</div>";
            }

        } catch (error) {
            console.error("Erro ao buscar tempos de fila:", error);
            errorDisplay.textContent = `Erro ao carregar os tempos de fila para ${parkName}. Detalhes: ${error.message}. Tente novamente mais tarde.`;
            loadingMessage.style.display = "none";
        }
    }

    function startAutoUpdate(parkName) {
        clearInterval(updateInterval);
        fetchWaitTimes(parkName);
        updateInterval = setInterval(() => fetchWaitTimes(parkName), 60000);
    }

    parkSelect.addEventListener("change", (event) => {
        const selectedPark = event.target.value;
        startAutoUpdate(selectedPark);
    });

    startAutoUpdate(parkSelect.value);
});

