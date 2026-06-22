<script setup lang="ts">
import { ref } from 'vue'
import { usePdfExport } from '@/composables/usePdfExport.ts'
import TablerIcon from '@/components/ui/TablerIcon.vue'

const { downloadPdf } = usePdfExport()
const exporting = ref(false)

async function handleDownload() {
  if (exporting.value) return
  exporting.value = true
  try {
    await downloadPdf()
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="export-card">
    <div class="export-card__info">
      <div class="export-card__icon" aria-hidden="true">
        <TablerIcon name="file-download" :size="16" />
      </div>
      <p class="export-card__text">
        Save a PDF summary of your trip with map and emissions data.
      </p>
    </div>

    <button
      class="export-card__btn"
      type="button"
      :disabled="exporting"
      :aria-busy="exporting"
      :aria-label="exporting ? 'Generating PDF summary' : 'Save results as PDF'"
      @click="handleDownload"
    >
      <TablerIcon name="download" :size="16" />
      {{ exporting ? 'Generating…' : 'Save results as PDF' }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.export-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  width: 100%;
  padding: $space-2 $space-3;
  background: var(--surface-raised);
  border: $border-control solid var(--border-subtle);
  border-radius: $radius-lg;
  flex-shrink: 0;

  &__info {
    display: flex;
    align-items: center;
    gap: $space-2;
    min-width: 0;
    flex: 1;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: $radius-md;
    background: $green-100;
    color: $green-700;
    flex-shrink: 0;

    .tabler-icon { flex-shrink: 0; }
  }

  &__text {
    margin: 0;
    font-size: $text-sm;
    line-height: 1.45;
    color: var(--text-secondary);
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: $space-2;
    flex-shrink: 0;
    padding: $space-2 $space-3;
    background: $green-700;
    color: $white;
    border-radius: $radius-lg;
    font-size: $text-sm;
    font-weight: 600;
    white-space: nowrap;
    transition:
      background   $transition-fast,
      box-shadow   $transition-fast,
      transform    $transition-fast;
    box-shadow: 0 2px 8px rgba($green-700, 0.3);

    .tabler-icon { flex-shrink: 0; }

    &:hover:not(:disabled) {
      background: $green-500;
      box-shadow: 0 4px 12px rgba($green-700, 0.35);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) { transform: translateY(0); }

    &:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
  }

  @media (max-width: $bp-tablet) {
    flex-direction: column;
    align-items: stretch;
    gap: $space-2;
    padding: $space-2;

    &__info {
      display: none;
    }

    &__btn {
      width: 100%;
      padding: $space-2 $space-4;
    }
  }
}
</style>
