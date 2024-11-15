<script>

import { onMounted, reactive } from 'vue';

export default {
    name:"SnakeGame",
  setup(){
   
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


        onMounted(async () => {
            const canvas = document.getElementById('snakeCanvas');
            const context = canvas.getContext('2d');
            initializeBoard();
            startSnakeGame();
            

            setInterval(() => {
                drawSnakeAndFood(context);
            });
        });




        return {
            
            snakeGame,
            startSnakeGame,
            changeDirection,
        }



  }


}


</script>
<template>
  
        <div class="col-span-12 lg:col-span-8 h-full flex flex-col justify-center items-center">

            <div class="w-full p-4 flex flex-col justify-center items-center h-full">
                <!-- Título centrado -->
               

                <!-- Puntajes en fila -->
                <div class="flex justify-between w-full ">
                    <p class="text-left"><strong>Score:</strong> {{ snakeGame.score }}</p>
                    <p class="text-right"><strong>High Score:</strong> {{ snakeGame.highScore }}</p>
                </div>

                <!-- Canvas -->
                <canvas id="snakeCanvas" width="300" height="300" class="border mx-auto snake"></canvas>

                <!-- Botón centrado -->
                <Button @click="startSnakeGame" class="mt-4 p-button w-[300px] mx-auto">Reiniciar Snake</Button>
            </div>

        </div>
</template>
