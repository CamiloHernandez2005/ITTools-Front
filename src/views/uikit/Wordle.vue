<template>
  <div class="w-full p-4 h-full flex flex-col justify-center items-center">
    <!-- Título con intentos restantes -->
    <h2 class="text-2xl font-bold mb-4">
      Guess the word ({{ maxAttempts - currentAttempt }} attempts left)
    </h2>

    <!-- Contenedor de intentos -->
    <div class="wordle-grid">
      <div
        v-for="(attempt, attemptIndex) in attempts"
        :key="attemptIndex"
        class="wordle-row"
        v-show="attemptIndex <= currentAttempt"
      >
        <div
          v-for="(letter, letterIndex) in attempt.letters"
          :key="letterIndex"
          class="letter-box"
          :class="{ correct: attempt.matches[letterIndex] === 'correct', present: attempt.matches[letterIndex] === 'present' }"
        >
          <input
            ref="inputs"
            type="text"
            :value="letter"
            maxlength="1"
            :disabled="attemptIndex !== currentAttempt"
            @input="onInput($event, attemptIndex, letterIndex)"
            @keydown.backspace="onBackspace($event, attemptIndex, letterIndex)"
          />
        </div>
      </div>
    </div>

    <!-- Mensajes -->
    <p v-if="message" class="text-red-500 font-bold mt-4">{{ message }}</p>

    <!-- Botón de reinicio -->
    <Button class="p-button mt-4 w-full" id="create-button" @click="resetGame">Reset Wordle</Button>
  </div>
</template>
<script>
import axios from '@/axios';

export default {
  data() {
    return {
      wordList: [],
      targetWord: "",
      wordLength: 0,
      attempts: [],
      maxAttempts: 5,
      currentAttempt: 0,
      message: "",
    };
  },
  watch: {
    wordLength(newLength) {
      // Cuando cambia la longitud de la palabra, reiniciamos los intentos
      this.attempts = Array.from({ length: this.maxAttempts }, () => ({
        letters: Array(newLength).fill(""),
        matches: Array(newLength).fill(""),
      }));
    }
  },
  methods: {
    // Función para obtener una nueva palabra aleatoria desde el servidor
    async fetchWord() {
      try {
        const response = await axios.get('/admin/random-word');

        // Normalizamos la palabra objetivo
        this.targetWord = this.removeAccents(response.data[0].trim().toLowerCase());
        this.wordLength = this.targetWord.length;
      } catch (error) {
        console.error('Error fetching random word:', error);
        this.message = 'Error fetching the word, please try again later.';
      }
    },

    // Función para reiniciar el juego y obtener una nueva palabra
    async resetGame() {
      // Llamamos a fetchWord para obtener una nueva palabra
      await this.fetchWord();

      // Reiniciamos el contador de intentos, los cuadros de letras y el mensaje
      this.currentAttempt = 0;
      this.message = "";

      // Aseguramos que todos los intentos se vacíen (borra las letras anteriores)
      this.attempts = Array.from({ length: this.maxAttempts }, () => ({
        letters: Array(this.wordLength).fill(""),  // Borra los valores escritos
        matches: Array(this.wordLength).fill(""),
      }));
    },

    removeAccents(str) {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    },

    onInput(event, attemptIndex, letterIndex) {
      const value = event.target.value.toUpperCase();
      if (/^[A-Z]$/.test(value)) {
        this.attempts[attemptIndex].letters[letterIndex] = value;

        this.$nextTick(() => {
          const nextIndex = letterIndex + 1;
          const inputs = this.$refs.inputs;
          if (nextIndex < this.wordLength && inputs) {
            inputs[attemptIndex * this.wordLength + nextIndex].focus();
          } else if (letterIndex === this.wordLength - 1) {
            this.checkWord();
          }
        });
      } else {
        event.target.value = "";
      }
    },

    onBackspace(event, attemptIndex, letterIndex) {
      if (event.key === "Backspace") {
        this.attempts[attemptIndex].letters[letterIndex] = "";

        this.$nextTick(() => {
          const prevIndex = letterIndex - 1;
          const inputs = this.$refs.inputs;
          if (prevIndex >= 0 && inputs) {
            inputs[attemptIndex * this.wordLength + prevIndex].focus();
          }
        });
      }
    },

    checkWord() {
      const attempt = this.attempts[this.currentAttempt];
      const word = this.removeAccents(attempt.letters.join("").toLowerCase());

      if (word.length !== this.wordLength) {
        this.message = "The word is incomplete.";
        return;
      }

      this.message = "";
      const matches = Array(this.wordLength).fill("");

      for (let i = 0; i < this.wordLength; i++) {
        if (word[i] === this.targetWord[i]) {
          matches[i] = "correct";
        } else if (this.targetWord.includes(word[i])) {
          matches[i] = "present";
        }
      }

      attempt.matches = matches;

      if (word === this.targetWord) {
        this.message = "Congratulations! You guessed the word.";
      } else if (this.currentAttempt >= this.maxAttempts - 1) {
        this.message = `You lost. The word was: ${this.targetWord}`;
      } else {
        this.currentAttempt++;
        this.$nextTick(() => {
          const inputs = this.$refs.inputs;
          const firstInputIndex = this.currentAttempt * this.wordLength;
          if (inputs && inputs[firstInputIndex]) {
            inputs[firstInputIndex].focus();
          }
        });
      }
    },
  },
  mounted() {
    this.fetchWord(); // Cargamos una palabra al montar el componente
  },
};
</script>




<style scoped>
.wordle-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.wordle-row {
  display: flex;
  gap: 5px;
  justify-content: center;
}
.letter-box {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--surface-border);
  background-color: var(--surface-ground);
  color: var(--text-color);
  text-align: center;
}
.letter-box.correct {
    background-color: #6aaa64;
    color: white;
  }
  .letter-box.present {
    background-color: #c9b458;
    color: white;
  }
.letter-box input {
  width: 100%;
  height: 100%;
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  text-transform: uppercase;
  border: none;
  background: transparent;
  outline: none;
  cursor: pointer;
  color: inherit;
}
.letter-box input:disabled {
  cursor: not-allowed;
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

  </style>
  