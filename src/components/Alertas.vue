<template>
  <div v-if="visible" class="help-tooltip" :style="style">
    {{ message }}
  </div>
</template>

<script>
export default {
  props: {
    message: {
      type: String,
      required: true
    },
    visible: {
      type: Boolean,
      required: true
    }
  },
  watch: {
    visible(newValue) {
      console.log('Tooltip visible:', newValue);
    }
  }
};
</script>


<style scoped>
.help-tooltip {
  position: absolute;
  color: white;
  background: blue;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}
</style>
