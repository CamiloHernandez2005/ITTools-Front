<script>
import { ref } from 'vue';
import axios from '../../axios';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import logo1 from '@/assets/emida-image.png';

export default {
  components: {
    Button,
    InputText,
    Textarea,
    Dropdown
  },
  setup() {
    const breadcrumbItems = ref([
      { label: 'Home', icon: 'pi pi-home', url: '/' },
      { label: 'Support', icon: 'pi pi-user', route: { name: 'Support' } }
    ]);

    const summary = ref('');
    const description = ref('');
    const projectKey = ref('');
    const issueType = ref(null); // Inicializado como null para el dropdown
    const issueTypes = ref([
      { label: 'Task', value: 'Task', icon: 'pi pi-check' },
      { label: 'Bug', value: 'Bug', icon: 'pi pi-exclamation-circle' },
      { label: 'History', value: 'History', icon: 'pi pi-bookmark' }
    ]);


    const accessToken = localStorage.getItem('jiraAccessToken'); // Obtener el token de Jira desde localStorage

    const createIssue = async () => {
      try {
        const issueDetails = {
          authorizationToken: `Bearer ${accessToken}`, // Concatenar "Bearer " con el token
          projectKey: projectKey.value,
          summary: summary.value,
          description: description.value,
          issueType: issueType.value, // Enviar el valor del dropdown
        };

        const response = await axios.post('/jira/createIssue', issueDetails);

        console.log('Issue created successfully:', response.data);
        alert('Issue created successfully!');
      } catch (error) {
        console.error('Error creating issue:', error.response ? error.response.data : error.message);
        alert('Error creating issue');
      }
    };

    return {
      summary,
      description,
      projectKey,
      issueType,
      issueTypes,
      createIssue,
      breadcrumbItems,
      logo1
    };
  }
};
</script>


<template>
  <div class="flex flex-col h-screen p-4">
    <!-- Contenido con la tarjeta del formulario -->
    <div class="card p-6 flex flex-col shadow-custom border">
      <!-- Agrupar los dos elementos: título y breadcrumb -->
      <div class="header-container">
        <div class="title font-semibold text-xl">Support</div>
        <Breadcrumb :model="breadcrumbItems" class="breadcrumb-item" />
      </div>

      <!-- Sección que agrupa imagen y formulario -->
      <div class="flex flex-grow">
        <!-- Columna izquierda con la imagen -->
        <div class="w-1/3 p-4">
          <img :src="logo1" alt="Company Logo" class="w-full h-auto" />
        </div>

        <!-- Columna derecha con el formulario -->
        <div class="w-2/3 p-4">
          <div class="form-container">
            <h2 class="text-2xl font-semibold">Contact us</h2>
            <div class="title font-semibold mb-4">Create jira issue</div>
            <form @submit.prevent="createIssue">
              <!-- Fila con Project, Issue Type y Summary -->
              <div class="flex mb-4 space-x-4">
                <!-- Fila con Project -->
                <div class="w-1/3">
                  <label for="projectKey" class="block text-sm font-medium">Project</label>
                  <InputText type="text" id="projectKey" v-model="projectKey" class="input-field input-with-line"
                    placeholder="Enter the project" required />
                </div>

                <!-- Fila con Issue Type -->
                <div class="w-1/3">
                  <label for="issueType" class="block text-sm font-medium mb-1">Issue type</label>
                  <Dropdown v-model="issueType" :options="issueTypes" optionLabel="label" optionValue="value"
                    placeholder="Select issue type" class="w-full" :filter="false">
                    <template #item="slotProps">
                      <div class="flex items-center">
                        <i :class="slotProps.option.icon" class="mr-2"></i>
                        <span>{{ slotProps.option.label }}</span>
                      </div>
                    </template>
                  </Dropdown>
                </div>

                <!-- Fila con Summary -->
                <div class="w-1/3">
                  <label for="summary" class="block text-sm font-medium">Summary</label>
                  <InputText type="text" id="summary" v-model="summary" class="input-field input-with-line"
                    placeholder="Enter the summary" required />
                </div>
              </div>

              <!-- Fila con Description -->
              <div class="mb-4">
                <label for="description" class="block text-sm font-medium">Description</label>
                <Textarea id="description" v-model="description" rows="4" class="input-field input-with-line"
                  placeholder="Enter the description" required></Textarea>
              </div>

              <!-- Botón para enviar el formulario -->
              <div class="flex justify-end mt-4">
                <Button type="submit" class="submit-btn" id="create-button">Submit</Button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>



<style scoped>
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -1rem;
}

/* Imagen */
img {
  border-radius: 8px;
}

/* Estilos del formulario */
.input-field {
  width: 100%;
  padding: 8px;
  margin-top: 4px;
  border: 1px solid #ccc;
  border-radius: 4px;
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

.input-with-line {
  border: none;
  border-bottom: 1px solid #d1d5db;
  /* Línea gris clara */
  padding: 0.5rem 0.4rem;
  background: transparent;
  /* Fondo transparente */
  outline: none;
  box-shadow: none;
  margin-bottom: 0.5rem;
}

.shadow-custom {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  /* Opcional: redondear bordes */
}
</style>
