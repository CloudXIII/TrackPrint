<script setup lang="ts">
import TablerIcon from '@/components/ui/TablerIcon.vue'
import type { GeocodingResult } from '@/types/index.ts'

defineProps<{
  id: string
  label: string
  icon: string
  iconVariant?: 'default' | 'dest'
  placeholder: string
  suggestions: GeocodingResult[]
  geocodingError?: string | null
  validationError?: string
}>()

const query = defineModel<string>('query', { required: true })

const emit = defineEmits<{
  input: []
  focus: []
  blur: []
  select: [suggestion: GeocodingResult]
}>()
</script>

<template>
  <div class="location-field" :class="{ 'location-field--error': validationError }">
    <label class="form-label location-field__label" :for="id">
      <TablerIcon
        :name="icon"
        :size="14"
        class="location-field__label-icon"
        :class="{ 'location-field__label-icon--dest': iconVariant === 'dest' }"
      />
      {{ label }}
    </label>
    <div class="location-field__wrap">
      <input
        :id="id"
        v-model="query"
        class="input location-field__input"
        type="text"
        :placeholder="placeholder"
        autocomplete="off"
        spellcheck="false"
        @input="emit('input')"
        @focus="emit('focus')"
        @blur="emit('blur')"
      />
      <ul v-if="suggestions.length" class="location-field__dropdown" role="listbox">
        <li
          v-for="(suggestion, index) in suggestions"
          :key="`${suggestion.label}-${index}`"
          class="location-field__option"
          role="option"
          @mousedown.prevent="emit('select', suggestion)"
        >
          <TablerIcon name="map-pin" :size="14" />
          <span>{{ suggestion.label }}</span>
        </li>
      </ul>
    </div>
    <span v-if="geocodingError && !validationError" class="location-field__error" role="alert">
      {{ geocodingError }}
    </span>
    <span v-if="validationError" class="location-field__error" role="alert">
      {{ validationError }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.location-field {
  display: flex;
  flex-direction: column;
  gap: $space-1;

  &__label {
    display: flex;
    align-items: center;
    gap: $space-1;
  }

  &__label-icon {
    font-size: $text-base;
    color: $green-500;

    &--dest {
      color: $green-700;
    }
  }

  &__wrap {
    position: relative;
  }

  &__input {
    padding: $space-2 $space-3;
    font-size: $text-base;
  }

  &--error &__input {
    border-color: $error;
  }

  &__error {
    font-size: $text-sm;
    color: $error;
  }

  &__dropdown {
    position: absolute;
    top: calc(100% + $space-1);
    left: 0;
    right: 0;
    z-index: 30;
    background: $white;
    border: $border-control solid $green-100;
    border-radius: $radius-md;
    box-shadow: $shadow-lg;
    max-height: 220px;
    overflow-y: auto;

    @media (max-width: $bp-tablet) {
      max-height: min(220px, 40vh);
    }
  }

  &__option {
    display: flex;
    align-items: flex-start;
    gap: $space-2;
    padding: $space-2 $space-3;
    cursor: pointer;
    font-size: $text-sm;
    color: $gray-900;
    transition: background $transition-fast;

    &:hover {
      background: $green-50;
    }

    .tabler-icon {
      color: $green-500;
      font-size: $text-sm;
      margin-top: 2px;
      flex-shrink: 0;
    }

    span {
      white-space: pre-wrap;
      word-break: break-word;
    }
  }
}
</style>
