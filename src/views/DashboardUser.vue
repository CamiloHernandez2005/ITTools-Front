<script>
import ActuatorService from '@/services/ActuatorService';
import { ref, onMounted, computed, reactive } from 'vue';
import { serverService } from '@/services/AgentService';
import { regionService } from '@/services/RegionService';
import dayjs from 'dayjs';
import image from '@/assets/welcome.jpg';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';

// Registro de componentes necesarios para Chart.js
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default {
    setup() {
        const audits = ref([]);
        const userEmail = ref(localStorage.getItem('userEmail') || '');
        const regions = ref([]);
        const agents = ref([]);
        const chartDataRegions = ref(null);
        const twitterProfile = ref(null); // Variable para almacenar información del perfil de Twitter
        const username = '@ELTIEMPO';
        const snakeGame = reactive({
            boardSize: 15,
            board: [],
            snake: [{ x: 10, y: 10 }],
            food: { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) },
            direction: { x: 0, y: 1 },
            nextDirection: { x: 0, y: 1 },
            score: 0,
            highScore: localStorage.getItem('highScore') || 0,
            isGameOver: false,
            intervalId: null,
            isBlinking: false,
            snakeColor: 'green', // Color inicial de la serpiente
            gameSpeed: 400 // Velocidad inicial de actualización en ms
        });
        // Función para activar el parpadeo en rojo al perder
        function triggerBlink() {
            snakeGame.isBlinking = true;
            setTimeout(() => {
                snakeGame.isBlinking = false;
            }, 300);
        }

        // Función para inicializar el tablero
        function initializeBoard() {
            snakeGame.board = Array(snakeGame.boardSize)
                .fill(null)
                .map(() => Array(snakeGame.boardSize).fill(null));
        }

        // Función para iniciar el juego
        function startSnakeGame() {
            snakeGame.snake = [{ x: 5, y: 5 }];
            snakeGame.direction = { x: 0, y: 1 };
            snakeGame.nextDirection = { x: 0, y: 1 };
            snakeGame.food = { x: Math.floor(Math.random() * snakeGame.boardSize), y: Math.floor(Math.random() * snakeGame.boardSize) };
            snakeGame.score = 0;
            snakeGame.isGameOver = false;
            snakeGame.gameSpeed = 400; // Restablecer la velocidad inicial
            spawnFood();

            if (snakeGame.intervalId) clearInterval(snakeGame.intervalId);
            snakeGame.intervalId = setInterval(snakeGameLoop, snakeGame.gameSpeed);
        }

        function updateGameSpeed() {
            let speed = 400; // Velocidad inicial en ms
            if (snakeGame.score >= 30)
                speed = 150; // Velocidad a partir de 30 puntos
            else if (snakeGame.score >= 20)
                speed = 200; // Velocidad a partir de 20 puntos
            else if (snakeGame.score >= 10)
                speed = 300; // Velocidad a partir de 10 puntos
            else if (snakeGame.score >= 5) speed = 350; // Velocidad a partir de 5 puntos

            // Si la velocidad cambió, reiniciamos el intervalo
            if (speed !== snakeGame.gameSpeed) {
                snakeGame.gameSpeed = speed;
                clearInterval(snakeGame.intervalId);
                snakeGame.intervalId = setInterval(snakeGameLoop, snakeGame.gameSpeed);
            }
        }

        // Función para generar la fruta en una posición aleatoria
        function spawnFood() {
            snakeGame.food = {
                x: Math.floor(Math.random() * snakeGame.boardSize),
                y: Math.floor(Math.random() * snakeGame.boardSize)
            };
        }

        // Bucle del juego
        function snakeGameLoop() {
            if (snakeGame.isGameOver) {
                if (snakeGame.score > snakeGame.highScore) {
                    snakeGame.highScore = snakeGame.score;
                    localStorage.setItem('highScore', snakeGame.highScore);
                }
                triggerBlink();
                clearInterval(snakeGame.intervalId);
                return;
            }
            // Cambiar el color de la serpiente en función del puntaje
            if (snakeGame.score >= 30) {
                snakeGame.snakeColor = 'purple';
            } else if (snakeGame.score >= 20) {
                snakeGame.snakeColor = 'blue';
            } else if (snakeGame.score >= 10) {
                snakeGame.snakeColor = 'orange';
            } else if (snakeGame.score >= 5) {
                snakeGame.snakeColor = 'gray';
            } else {
                snakeGame.snakeColor = 'green';
            }

            // Actualizar la dirección
            snakeGame.direction = snakeGame.nextDirection;

            const head = {
                x: snakeGame.snake[0].x + snakeGame.direction.x,
                y: snakeGame.snake[0].y + snakeGame.direction.y
            };

            // Comprobar colisiones con las paredes o con la serpiente misma
            if (head.x < 0 || head.x >= snakeGame.boardSize || head.y < 0 || head.y >= snakeGame.boardSize || snakeGame.snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
                snakeGame.isGameOver = true;
                return;
            }

            // Mover la serpiente
            snakeGame.snake.unshift(head);

            // Comprobar si la serpiente come la fruta
            if (head.x === snakeGame.food.x && head.y === snakeGame.food.y) {
                snakeGame.score++;
                spawnFood();
                updateGameSpeed(); // Actualizar la velocidad después de ganar un punto
            } else {
                snakeGame.snake.pop();
            }
        }

        // Cambiar la dirección de la serpiente
        function changeDirection(newDirection) {
            if ((newDirection.x !== -snakeGame.direction.x || newDirection.y !== -snakeGame.direction.y) && (newDirection.x !== snakeGame.direction.x || newDirection.y !== snakeGame.direction.y)) {
                snakeGame.nextDirection = newDirection;
            }
        }

        // Función para dibujar la serpiente y la manzana en el canvas
        // Función para dibujar la serpiente y la manzana en el canvas
        function drawSnakeAndFood(context) {
            context.clearRect(0, 0, 300, 300); // Limpiar el canvas antes de cada renderizado

            // Dibujar la manzana con forma redondeada y con tallo
            const appleX = snakeGame.food.x * 20 + 10; // Centro del círculo
            const appleY = snakeGame.food.y * 20 + 10;
            context.fillStyle = 'red';

            // Dibuja el círculo para la manzana
            context.beginPath();
            context.arc(appleX, appleY, 8, 0, Math.PI * 2); // Radio de 8
            context.fill();

            // Dibujar el tallo de la manzana
            context.strokeStyle = 'brown';
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(appleX, appleY - 8);
            context.lineTo(appleX, appleY - 12);
            context.stroke();

            // Dibujar una pequeña hoja junto al tallo
            context.fillStyle = 'green';
            context.beginPath();
            context.arc(appleX + 3, appleY - 12, 2, 0, Math.PI * 2);
            context.fill();

            // Definir colores de la serpiente según el puntaje
            let snakeColor = 'green';
            let snakeBorderColor = 'darkgreen';
            if (snakeGame.score >= 30) {
                snakeColor = 'purple';
                snakeBorderColor = 'darkpurple';
            } else if (snakeGame.score >= 20) {
                snakeColor = 'blue';
                snakeBorderColor = 'darkblue';
            } else if (snakeGame.score >= 10) {
                snakeColor = 'orange';
                snakeBorderColor = 'darkorange';
            } else if (snakeGame.score >= 5) {
                snakeColor = 'gray';
                snakeBorderColor = 'darkgray';
            }

            // Dibujar el cuerpo de la serpiente, parpadeando si es game over
            const fillColor = snakeGame.isBlinking ? 'red' : snakeColor;
            const borderColor = snakeGame.isBlinking ? 'darkred' : snakeBorderColor;
            snakeGame.snake.forEach((segment) => {
                context.fillStyle = fillColor;
                context.strokeStyle = borderColor;
                context.lineWidth = 2;

                // Dibujar cada segmento con bordes redondeados
                context.beginPath();
                context.roundRect(segment.x * 20 + 2, segment.y * 20 + 2, 16, 16, 5); // Bordes redondeados
                context.fill();
                context.stroke();
            });

            // Dibujar los ojos en la cabeza de la serpiente
            const head = snakeGame.snake[0];
            context.fillStyle = 'white'; // Color de los ojos

            let eye1X, eye1Y, eye2X, eye2Y;

            // Ajustar la posición de los ojos según la dirección
            if (snakeGame.direction.x === 1) {
                eye1X = head.x * 20 + 15;
                eye1Y = head.y * 20 + 5;
                eye2X = head.x * 20 + 15;
                eye2Y = head.y * 20 + 15;
            } else if (snakeGame.direction.x === -1) {
                eye1X = head.x * 20 + 5;
                eye1Y = head.y * 20 + 5;
                eye2X = head.x * 20 + 5;
                eye2Y = head.y * 20 + 15;
            } else if (snakeGame.direction.y === 1) {
                eye1X = head.x * 20 + 5;
                eye1Y = head.y * 20 + 15;
                eye2X = head.x * 20 + 15;
                eye2Y = head.y * 20 + 15;
            } else if (snakeGame.direction.y === -1) {
                eye1X = head.x * 20 + 5;
                eye1Y = head.y * 20 + 5;
                eye2X = head.x * 20 + 15;
                eye2Y = head.y * 20 + 5;
            }

            // Dibujar los ojos
            context.beginPath();
            context.arc(eye1X, eye1Y, 2, 0, Math.PI * 2); // Ojo izquierdo
            context.arc(eye2X, eye2Y, 2, 0, Math.PI * 2); // Ojo derecho
            context.fill();
        }

        // Extensión para dibujar rectángulos con bordes redondeados en Canvas
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
            this.beginPath();
            this.moveTo(x + radius, y);
            this.lineTo(x + width - radius, y);
            this.quadraticCurveTo(x + width, y, x + width, y + radius);
            this.lineTo(x + width, y + height - radius);
            this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            this.lineTo(x + radius, y + height);
            this.quadraticCurveTo(x, y + height, x, y + height - radius);
            this.lineTo(x, y + radius);
            this.quadraticCurveTo(x, y, x + radius, y);
            this.closePath();
            return this;
        };

        // Manejar eventos de teclado para cambiar la dirección
        window.addEventListener('keydown', (event) => {
            // Prevenir el desplazamiento cuando se presionan las teclas de flechas
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
                event.preventDefault();
            }

            // Cambiar la dirección de la serpiente
            if (event.code === 'ArrowUp') {
                changeDirection({ x: 0, y: -1 });
            } else if (event.code === 'ArrowDown') {
                changeDirection({ x: 0, y: 1 });
            } else if (event.code === 'ArrowLeft') {
                changeDirection({ x: -1, y: 0 });
            } else if (event.code === 'ArrowRight') {
                changeDirection({ x: 1, y: 0 });
            }
        });

        const fetchTwitterProfile = async (username) => {
            try {
                const response = await fetch(`/api/twitter/profile?username=${username}`);
                twitterProfile.value = await response.json();
            } catch (error) {
                console.error('Error fetching Twitter profile:', error);
            }
        };

        const fetchRegionAndAgentData = async () => {
            try {
                regions.value = await regionService.getAllRegions();
                agents.value = await serverService.getAllServers();
            } catch (error) {
                console.error('Error:', error);
            }
        };

        const fetchAuditData = async () => {
            try {
                const response = await ActuatorService.getAuditData();
                audits.value = response.data || [];
                processAuditData();
            } catch (error) {
                console.error('Error fetching audit data:', error);
            }
        };

        const filteredAudits = computed(() => {
            return audits.value.filter((audit) => {
                const emailInUserName = audit.userName.split('|')[0].trim();
                return emailInUserName === userEmail.value;
            });
        });

        const processAuditData = () => {
            const regionAgentCountMap = {};
            const regionCountMap = {};

            filteredAudits.value.forEach((audit) => {
                const parsedData = parseAuditMessage(audit.userAction);
                if (parsedData.regionId !== null) {
                    const regionName = getRegionNameById(parsedData.regionId);

                    if (!regionCountMap[regionName]) {
                        regionCountMap[regionName] = 0;
                        regionAgentCountMap[regionName] = {};
                    }
                    regionCountMap[regionName]++;

                    if (parsedData.agentId !== null) {
                        const agentName = getAgentNameById(parsedData.agentId);
                        regionAgentCountMap[regionName][agentName] = (regionAgentCountMap[regionName][agentName] || 0) + 1;
                    }
                }
            });

            chartDataRegions.value = setAuditChartData(regionCountMap, regionAgentCountMap);
        };
        function setAuditChartData(regionCountMap, regionAgentMap) {
            const labels = [];
            const data = [];
            const backgroundColors = [];

            const colorPalette = ['#54d4b4', '#614d56', '#a0d995', '#f7a072', '#c94c4c'];
            let colorIndex = 0;

            for (const region in regionCountMap) {
                labels.push(region);
                data.push(regionCountMap[region]);
                backgroundColors.push(colorPalette[colorIndex % colorPalette.length]);
                colorIndex++;
            }

            return {
                labels,
                datasets: [
                    {
                        data,
                        backgroundColor: backgroundColors
                    }
                ],
                // Añadimos detalles de los agentes para el tooltip
                agentDetails: regionAgentMap
            };
        }
        function getRegionNameById(regionId) {
            const region = regions.value.find((region) => region.idRegion === regionId);
            return region ? region.nameRegion : 'Unknown Region';
        }

        function getAgentNameById(agentId) {
            const agent = agents.value.find((agent) => agent.idAgent === agentId);
            return agent ? agent.agentName : 'Unknown Agent';
        }

        function parseAuditMessage(userAction = '') {
            const regionMatch = userAction.match(/Region ID: (\d+)/i);
            const agentMatch = userAction.match(/Agent ID: (\d+)/i);
            return {
                regionId: regionMatch ? parseInt(regionMatch[1]) : null,
                agentId: agentMatch ? parseInt(agentMatch[1]) : null
            };
        }

        function setAuditChartOptions() {
            const documentStyle = getComputedStyle(document.documentElement);
            const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

            return {
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: textMutedColor
                        }
                    },
                    tooltip: {
                        callbacks: {
                            // Tooltip personalizado para mostrar desglose por agentes
                            label: function (context) {
                                const region = context.label;
                                const regionAgentMap = chartDataRegions.value.agentDetails;
                                const agents = regionAgentMap[region];

                                const regionLine = `${region}`;
                                const regionTotalLine = `Total: ${context.raw}`;

                                if (agents) {
                                    const agentDetails = Object.entries(agents).map(([agent, count]) => {
                                        return `${agent}: ${count}`;
                                    });
                                    return [regionLine, regionTotalLine, ...agentDetails];
                                }
                                return [`${region}: ${context.raw}`];
                            }
                        }
                    }
                },
                maintainAspectRatio: false
            };
        }

        const chartOptionsAudits = ref(setAuditChartOptions());

        onMounted(async () => {
            const canvas = document.getElementById('snakeCanvas');
            const context = canvas.getContext('2d');
            await fetchRegionAndAgentData();
            await fetchAuditData();
            await fetchTwitterProfile(username);
            initializeBoard();
            startSnakeGame();

            setInterval(() => {
                drawSnakeAndFood(context);
            });

            // Cargar el script de Twitter para activar el widget
            const script = document.createElement('script');
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            script.onload = () => {
                // Solo recargar el widget si no se ha hecho aún
                if (window.twttr && twttr.widgets && typeof twttr.widgets.load === 'function') {
                    twttr.widgets.load();
                }
            };
            document.body.appendChild(script);
        });

        const formatDateTime = (value) => {
            return value ? dayjs(value).format('DD/MMM/YYYY HH:mm:ss') : '';
        };

        return {
            audits,
            filteredAudits,
            formatDateTime,
            userEmail,
            image,
            chartDataRegions,
            chartOptionsAudits,
            twitterProfile,
            snakeGame,
            startSnakeGame,
            changeDirection,
            username
        };
    },
    data() {
        return {
            board: Array(9).fill(''),
            currentPlayer: 'X',
            winner: null,
            isDraw: false
        };
    },
    methods: {
        makeMove(index) {
            if (this.board[index] === '' && !this.winner) {
                this.board[index] = 'X';
                if (!this.checkWinner()) {
                    this.autoMove();
                    this.checkWinner();
                }
            }
        },
        autoMove() {
            const winningCombinations = [
                [0, 1, 2],
                [3, 4, 5],
                [6, 7, 8],
                [0, 3, 6],
                [1, 4, 7],
                [2, 5, 8],
                [0, 4, 8],
                [2, 4, 6]
            ];
            for (let combo of winningCombinations) {
                const [a, b, c] = combo;
                const cells = [this.board[a], this.board[b], this.board[c]];

                if (cells.filter((cell) => cell === 'O').length === 2 && cells.includes('')) {
                    this.board[combo[cells.indexOf('')]] = 'O';
                    return;
                }
                if (cells.filter((cell) => cell === 'X').length === 2 && cells.includes('')) {
                    this.board[combo[cells.indexOf('')]] = 'O';
                    return;
                }
            }
            const emptyCells = this.board.map((cell, idx) => (cell === '' ? idx : null)).filter((idx) => idx !== null);
            if (emptyCells.length > 0) {
                const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                this.board[randomIndex] = 'O';
            }
        },
        checkWinner() {
            const winningCombinations = [
                [0, 1, 2],
                [3, 4, 5],
                [6, 7, 8],
                [0, 3, 6],
                [1, 4, 7],
                [2, 5, 8],
                [0, 4, 8],
                [2, 4, 6]
            ];
            for (let combo of winningCombinations) {
                const [a, b, c] = combo;
                if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                    this.winner = this.board[a];
                    return true;
                }
            }
            if (!this.board.includes('')) {
                this.isDraw = true;
            }
            return false;
        },
        resetTicTacToe() {
            this.board = Array(9).fill('');
            this.currentPlayer = 'X';
            this.winner = null;
            this.isDraw = false;
        }
    }
};
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Mensaje de bienvenida -->
        <div class="col-span-12 lg:col-span-3">
            <div class="card shadow-custom border h-full flex flex-col justify-center items-center">
                <div class="font-semibold text-xl mb-2 text-center">Welcome to ITTools {{ userEmail }}</div>
                <div class="flex items-center justify-center">
                    <img :src="image" alt="image" width="280px" />
                </div>
            </div>
        </div>

        <!-- Tabla de actividad -->
        <div class="col-span-12 lg:col-span-5">
            <div class="card p-4 shadow-custom border h-full">
                <div class="font-semibold text-xl mb-2">Activity</div>
                <DataTable :value="filteredAudits" class="p-datatable-sm" :paginator="true" :rows="6"  :totalRecords="filteredAudits.length" :sortField="'dateTime'" :sortOrder="-1" :emptyMessage="'No requests found'">
                    <Column field="userAction" header="Action" />
                    <Column field="dateTime" header="Date & time">
                        <template #body="slotProps">
                            {{ formatDateTime(slotProps.data.dateTime) }}
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <div class="col-span-12 md:col-span-4 items-center">
            <div class="card shadow-custom border h-full flex flex-col justify-center items-center">
                <a class="twitter-timeline" :href="`https://twitter.com/${username}`" width="100%" height="300">Tweets by {{ username }}</a>
            </div>
        </div>

        <div class="col-span-12 md:col-span-5 items-center">
            <div class="card shadow-custom border">
                <div class="font-semibold text-xl mb-4">Regions Usage</div>
                <!-- Gráfico de pastel -->
                <Chart type="doughnut" :data="chartDataRegions" :options="chartOptionsAudits" class="h-96" />
            </div>
        </div>

        <div class="col-span-12 lg:col-span-4">
            <div class="card p-4 shadow-custom border">
                <h2 class="text-center mb-2">Snake Game</h2>
                <div class="flex justify-between ml-28 mr-28">
                    <p><strong>Score:</strong> {{ snakeGame.score }}</p>
                    <p><strong>High Score:</strong> {{ snakeGame.highScore }}</p>
                </div>
                <canvas id="snakeCanvas" width="300" height="300" class="border mx-auto"></canvas>
                <button @click="startSnakeGame" class="mt-4 p-button w-full">Reiniciar Snake</button>
            </div>
        </div>

        <div class="col-span-12 lg:col-span-3">
            <div class="card p-4 shadow-custom border h-full flex flex-col justify-center items-center">
                <h2 class="text-center mb-5">Tic-Tac-Toe</h2>
                <div class="tic-tac-toe-board mb-4">
                    <div v-for="(cell, index) in board" :key="index" class="tic-tac-toe-cell border">
                        <Button @click="makeMove(index)" :disabled="cell !== '' || winner" class="tic-tac-toe-button p-component p-button-outlined">
                            {{ cell }}
                        </Button>
                    </div>
                    <br />
                </div>
                <p v-if="winner" class="winner-message text-center font-bold text-xl mt-2">{{ winner }} ha ganado!</p>
                <p v-else-if="isDraw" class="draw-message text-center font-bold text-xl mt-2">¡Es un empate!</p>
                <Button @click="resetTicTacToe" class="reset-button p-button p-component p-button-danger mt-4 w-full"> Reiniciar Tic-Tac-Toe </Button>
            </div>
        </div>
    </div>
</template>
<style scoped>
.shadow-custom {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
}

.tic-tac-toe-board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    max-width: 200px;
    margin: 0 auto;
}

.tic-tac-toe-button {
    width: 60px;
    height: 60px;
    font-size: 24px;
    border: 2px solid #333;
    cursor: pointer;
    transition: background-color 0.3s;
}

.tic-tac-toe-button:hover {
    background-color: rgba(0, 0, 0, 0.1); /* Fondo en hover */
}
</style>
