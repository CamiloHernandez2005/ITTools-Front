<script>
import ActuatorService from '@/services/ActuatorService';
import axios from '../axios';
import { ref, onMounted, computed, reactive } from 'vue';
import { serverService } from '@/services/AgentService';
import { regionService } from '@/services/RegionService';
import { authService } from '@/services/AuthService';
import Wordle from '@/views/uikit/Wordle.vue';
import dayjs from 'dayjs';
import image1 from '@/assets/img/img1.jpg';
import image2 from '@/assets/img/img2.jpg';
import image3 from '@/assets/img/img3.jpg';
import image4 from '@/assets/img/img4.jpg';
import image5 from '@/assets/img/img5.jpg';
import image6 from '@/assets/img/img6.jpg';
import image7 from '@/assets/img/img7.jpg';
import image8 from '@/assets/img/img8.jpg';
import image9 from '@/assets/img/img9.jpg';
import image10 from '@/assets/img/img10.jpg';
import image11 from '@/assets/img/img11.jpg';
import image12 from '@/assets/img/img12.jpg';
import image13 from '@/assets/img/img13.jpg';
import image14 from '@/assets/img/img14.jpg';
import image15 from '@/assets/img/img15.jpg';
import image16 from '@/assets/img/img16.jpg';
import image17 from '@/assets/img/img17.jpg';
import image18 from '@/assets/img/img18.jpg';
import image19 from '@/assets/img/img19.jpg';
import image20 from '@/assets/img/img20.jpg';
import image21 from '@/assets/img/img21.jpg';
import image22 from '@/assets/img/img22.jpg';
import image23 from '@/assets/img/img23.jpg';
import image24 from '@/assets/img/img24.jpg';
import image25 from '@/assets/img/img25.jpg';
import image26 from '@/assets/img/img26.jpg';
import image27 from '@/assets/img/img27.jpg';
import image28 from '@/assets/img/img28.jpg';
import image29 from '@/assets/img/img29.jpg';
import image30 from '@/assets/img/img30.jpg';
import image31 from '@/assets/img/img31.jpg';
import image32 from '@/assets/img/img32.jpg';
import image33 from '@/assets/img/img33.jpg';
import image34 from '@/assets/img/img34.jpg';
import image35 from '@/assets/img/img35.jpg';
import image36 from '@/assets/img/img36.jpg';
import image37 from '@/assets/img/img37.jpg';
import image38 from '@/assets/img/img38.jpg';
import image39 from '@/assets/img/img39.jpg';
import image40 from '@/assets/img/img40.jpg';
import image41 from '@/assets/img/img41.jpg';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';

// Registro de componentes necesarios para Chart.js
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default {
    components: {
        Wordle
    },
    setup() {
        const audits = ref([]);
        const userEmail = ref(localStorage.getItem('userEmail') || '');
        const userName = ref(localStorage.getItem('userName') || '');
        const regions = ref([]);
        const agents = ref([]);
        const showModal = ref(false);
        const marqueeMessages = ref([]);
        const newMessage = ref('');
        const isAdmin = ref(false);
        const chartDataRegions = ref(null);
        const twitterProfile = ref(null); // Variable para almacenar información del perfil de Twitter
        const username = '@ELTIEMPO';
        const calendarUrl = ref('');
        const currentImage = ref('');
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

        function setRandomImage() {
            const images = [
                image1,
                image2,
                image3,
                image4,
                image5,
                image6,
                image7,
                image8,
                image9,
                image10,
                image11,
                image12,
                image13,
                image14,
                image15,
                image16,
                image17,
                image18,
                image19,
                image20,
                image21,
                image22,
                image23,
                image24,
                image25,
                image26,
                image27,
                image28,
                image29,
                image30,
                image31,
                image32,
                image33,
                image34,
                image35,
                image36,
                image37,
                image38,
                image39,
                image40,
                image41
            ];
            const randomIndex = Math.floor(Math.random() * images.length);
            currentImage.value = images[randomIndex];
        }

        function setCalendarUrl() {
            if (userEmail.value) {
                calendarUrl.value = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(userEmail.value)}&ctz=America%2FBogota`;
            }
        }

        // Verificar rol del usuario almacenado en localStorage
        const loadUserRole = async () => {
            // Eliminar roles almacenados en localStorage si existen
            localStorage.removeItem('roles');

            // Obtener el email del usuario del localStorage
            const userEmail = localStorage.getItem('userEmail');
            if (!userEmail) {
                console.error('No se encontró userEmail en el localStorage');
                return;
            }

            try {
                // Llamar a getUsers para obtener los datos del usuario
                const users = await authService.getUsers();
                const user = users.find((u) => u.email === userEmail);

                if (user && user.roles) {
                    // Guardar el rol en localStorage
                    // Verificar si el usuario es ADMIN
                    isAdmin.value = user.roles.includes('ADMIN');
                } else {
                    console.error('No se encontró el usuario o los roles no están definidos');
                }
            } catch (error) {
                console.error('Error al obtener los roles del usuario:', error);
            }
        };

        // Fetch the marquee text
        const fetchMessages = async () => {
            try {
                const response = await axios.get('/admin/marquee');
                marqueeMessages.value = response.data;
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        const addMessage = async () => {
            if (newMessage.value.trim() !== '') {
                try {
                    await axios.post('/admin/marquee', { text: newMessage.value });
                    marqueeMessages.value.push(newMessage.value);
                    newMessage.value = '';
                } catch (error) {
                    console.error('Error adding message:', error);
                }
            }
        };

        const deleteMessage = async (index) => {
            try {
                await axios.delete(`/admin/marquee/${index}`);
                marqueeMessages.value.splice(index, 1);
            } catch (error) {
                console.error('Error deleting message:', error);
            }
        };

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
            let speed = 300; // Velocidad inicial en ms
            if (snakeGame.score >= 30)
                speed = 100; // Velocidad a partir de 30 puntos
            else if (snakeGame.score >= 20)
                speed = 150; // Velocidad a partir de 20 puntos
            else if (snakeGame.score >= 10)
                speed = 200; // Velocidad a partir de 10 puntos
            else if (snakeGame.score >= 5) speed = 250; // Velocidad a partir de 5 puntos

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
            initializeBoard();
            startSnakeGame();
            setRandomImage();
            setCalendarUrl();
            fetchMessages();
            loadUserRole();

            setInterval(() => {
                drawSnakeAndFood(context);
            });
        });

        const formatDateTime = (value) => {
            return value ? dayjs(value).format('DD/MMM/YYYY HH:mm:ss') : '';
        };

        return {
            audits,
            filteredAudits,
            formatDateTime,
            userEmail,
            userName,
            chartDataRegions,
            chartOptionsAudits,
            twitterProfile,
            snakeGame,
            startSnakeGame,
            changeDirection,
            username,
            currentImage,
            calendarUrl,
            isAdmin,
            marqueeMessages,
            newMessage,
            showModal,
            addMessage,
            deleteMessage
        };
    }
};
</script>
<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Fila superior con la bienvenida y la tabla de actividad -->
        <div class="lg:col-span-8">
            <div class="card shadow-custom border flex flex-col justify-center items-center">
                <div class="flex flex-col lg:flex-row gap-4 justify-center items-center w-full">
                    <!-- Primera tabla de actividad (más pequeña) -->
                    <div class="w-full lg:w-1/3 flex flex-col items-center">
                        <div class="font-semibold text-xl mb-2 text-center">Welcome {{ userName }}!</div>
                        <img :src="currentImage" class="imgmeme" alt="Random Welcome Image" />
                    </div>

                    <!-- Segunda tabla de actividad (más grande) -->
                    <div class="w-full lg:w-3/3 flex flex-col">
                        <div class="font-semibold text-xl mb-2">Your activity</div>
                        <DataTable :value="filteredAudits" class="p-datatable-sm w-full lg:w-auto" :paginator="true" :rows="4" :totalRecords="filteredAudits.length" :sortField="'dateTime'" :sortOrder="-1" :rowHover="true">
                            <template #empty> No user activity found. </template>
                            <template #loading> Loading user activity. Please wait. </template>
                            <Column field="userAction" header="Action" sortable />
                            <Column field="dateTime" header="Date & time " sortable>
                                <template #body="slotProps">
                                    {{ formatDateTime(slotProps.data.dateTime) }}
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
            </div>

            <div class="card shadow-custom border">
                <div class="flex items-center">
                    <div class="marquee-container overflow-hidden flex-grow relative">
                        <div class="animate-marquee whitespace-nowrap font-bold">
                            <span v-for="(message, index) in marqueeMessages" :key="index" class="ml-80">
                                {{ message }}
                            </span>
                        </div>
                    </div>

                    <!-- Botón para el admin -->
                    <div v-if="isAdmin" class="admin-button-card ml-4">
                        <Button icon="pi pi-plus" class="p-button-rounded p-button-outlined" @click="showModal = true" />
                    </div>
                </div>

                <!-- Modal para manejar mensajes -->
                <Dialog header="Manage messages" v-model:visible="showModal" :modal="true" style="width: 23%">
                    <div>
                        <ul>
                            <li v-for="(message, index) in marqueeMessages" :key="index" class="mb-2">
                                {{ message }}
                                <Button icon="pi pi-trash" class="p-button-danger ml-2" @click="deleteMessage(index)" />
                            </li>
                        </ul>
                        <div class="mt-4 flex justify-between items-center">
                            <!-- Input alineado a la izquierda -->
                            <InputText v-model="newMessage" placeholder="New message" class="w-80 mb-2" />

                            <!-- Botón alineado a la derecha -->
                            <Button label="Create" id="create-button" @click="addMessage" class="ml-2" />
                        </div>
                    </div>
                </Dialog>
            </div>

            <div class="col-span-12 lg:col-span-4 flex gap-8">
                <!-- Gráfico 1: Regions Usage -->
                <div class="w-full lg:w-1/2">
                    <div class="card shadow-custom border">
                        <div class="font-semibold text-xl mb-4">Regions usage</div>
                        <Chart type="doughnut" :data="chartDataRegions" :options="chartOptionsAudits" class="h-96" />
                    </div>
                </div>

                <div class="w-full lg:w-1/2">
                    <div class="card shadow-custom border h-full">
                        <div class="font-semibold text-xl mb-4">Your calendar</div>
                        <div v-if="calendarUrl">
                            <iframe :src="calendarUrl" style="border: 0" width="100%" height="330px" frameborder="0" scrolling="no"> </iframe>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Fila derecha con el Playground -->
        <div class="col-span-12 lg:col-span-4">
            <div class="card shadow-custom border h-full flex flex-col justify-center items-center">
                <h2 class="text-center font-semibold text-xl">Playground</h2>

                <!-- Contenedor de wordle -->
                <div class="w-full p-4 h-full flex flex-col justify-center items-center">
                    <Wordle />
                </div>

                <!-- Contenedor de Snake Game -->
                <div class="w-full p-4 h-full flex flex-col justify-center items-center">
                    <h2 class="text-center mb-2">Snake game</h2>
                    <div class="flex justify-between w-full mb-2">
                        <p><strong>Score:</strong> {{ snakeGame.score }}</p>
                        <p><strong>High score:</strong> {{ snakeGame.highScore }}</p>
                    </div>
                    <canvas id="snakeCanvas" width="300" height="300" class="border mx-auto snake"></canvas>
                    <Button @click="startSnakeGame" class="mt-4 p-button w-full" id="create-button">Reset snake</Button>
                </div>
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
    max-width: 400px;
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
    background-color: rgba(0, 0, 0, 0.1);
    /* Fondo en hover */
}

.snake {
    border: 2px solid #333;
    transition: background-color 0.3s;
}

.imgmeme {
    width: 15rem;
}

#create-button {
    background: #64c4ac;
    color: white;
    border-color: #64c4ac;
}

#create-button:hover {
    background: white;
    color: #64c4ac;
    border-color: #64c4ac;
}

@keyframes marquee {
    0% {
        transform: translateX(100%);
    }

    100% {
        transform: translateX(-100%);
    }
}

.animate-marquee {
    animation: marquee 20s linear infinite;
}
</style>
