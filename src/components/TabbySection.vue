<script setup lang="ts">
import { PlayIcon, StopIcon } from '@heroicons/vue/24/solid';
import { nextTick, ref, watch } from 'vue';
import Column from '../values/column';
import Cursor from '../values/cursor';
import Player from '../values/player';
import Section from '../values/section';
import TabbyButton from './TabbyButton.vue';
import TabbyColumn from './TabbyColumn.vue';
import TabbyInput from './TabbyInput.vue';
import TabbyModal from './TabbyModal.vue';
import TabbySlider from './TabbySlider.vue';

const props = withDefaults(
  defineProps<{
    section: Section;
    cursor: Cursor;
    isSelected: boolean;
    isReadOnly?: boolean;
    isDisabled?: boolean;
  }>(),
  {
    isReadOnly: false,
    isDisabled: false,
  }
);

const emits = defineEmits<{
  (e: 'sectionChanged', section: Section): void;
  (e: 'sectionDeleted'): void;
  (e: 'noteSelected', string: number, active: boolean, index: number): void;
  (e: 'settingsOpened'): void;
  (e: 'settingsClosed'): void;
  (e: 'sectionPlayed'): void;
  (e: 'sectionStopped'): void;
}>();

const sectionSettingsOpen = ref(false);
const updatedName = ref(props.section.name);
const player = new Player();
const isPlaying = ref(false);

watch(
  () => props.cursor,
  () => {
    if (!props.isReadOnly && props.isSelected && props.cursor.isCurrentColumn(props.section.columns.length)) {
      createColumn(props.cursor.currentString(), false);
    }
  }
);

const onColumnChanged = (column: Column, columnIndex: number) => {
  emits('sectionChanged', props.section.setColumn(column, columnIndex));
};

const onColumnDeleted = (columnIndex: number) => {
  emits('sectionChanged', props.section.deleteColumn(columnIndex));
};

const insertColumnBefore = () => {
  emits('sectionChanged', props.section.addColumn(props.cursor.column - 1));
  emits('noteSelected', props.cursor.string, false, props.cursor.column + 1);
};

const insertColumnAfter = () => {
  emits('sectionChanged', props.section.addColumn(props.cursor.column));
};

const createColumn = async (string: number, active: boolean) => {
  emits('sectionChanged', props.section.addColumn(props.section.columns.length));
  await nextTick();
  emits('noteSelected', string, active, props.section.columns.length - 1);
};

const onNoteSelected = (string: number, active: boolean, index: number) => {
  emits('noteSelected', string, active, index);
};

const onSettingsClosed = () => {
  emits('sectionChanged', props.section.updateName(updatedName.value));
  emits('settingsClosed');
};

const onUpdateBpm = (bpm: number) => {
  emits('sectionChanged', props.section.setBpm(bpm));
};

const onPlay = () => {
  if (!props.isDisabled) {
    isPlaying.value = true;
    player.setBpm(props.section.bpm).playSection(props.section);
    emits('sectionPlayed');
  }
};

const onStop = () => {
  if (isPlaying.value) {
    isPlaying.value = false;
    player.stop();
    emits('sectionStopped');
  }
};
</script>

<template>
  <div class="mb-6 text-gray-700">
    <div class="text-md mb-4 flex items-center font-bold">
      <div class="mr-4">{{ section.name }}</div>
      <TabbyButton
        v-if="!isReadOnly"
        @click="
          $emit('settingsOpened');
          sectionSettingsOpen = true;
        "
        text="Section Settings"
        class="mr-4"
        :disabled="isDisabled"
      />
      <div class="flex items-center">
        <PlayIcon
          @click="onPlay"
          :class="{ 'text-red-400 hover:text-red-400': isPlaying }"
          class="mr-2 h-4 w-4 cursor-pointer text-blue-400 transition hover:text-blue-500"
        />
        <StopIcon @click="onStop" class="h-4 w-4 cursor-pointer text-blue-400 transition hover:text-blue-500" />
        <TabbySlider
          :min="50"
          :max="700"
          :model-value="section.bpm"
          @update:model-value="onUpdateBpm"
          :disabled="isDisabled"
          class="ml-4 w-16"
        />
      </div>
    </div>

    <TabbyModal title="Section Settings" @closed="onSettingsClosed" v-model="sectionSettingsOpen">
      <TabbyInput label="Section Name" placeholder="e.g. Verse 1" v-model="updatedName" />

      <div class="mt-5 text-left text-base font-semibold leading-6 text-gray-700">Delete Section</div>
      <div class="mt-2 text-left">
        <TabbyButton
          @click="
            sectionSettingsOpen = false;
            $emit('sectionDeleted');
          "
          is-dangerous
          text="Delete Section"
        />
      </div>
    </TabbyModal>

    <div class="text-md flex whitespace-nowrap font-mono font-bold leading-none text-gray-700">
      <div class="inline-block">
        <div v-for="(tuning, index) in section.tuning" :key="index">{{ tuning.asString() }}</div>
      </div>
      <div class="inline-block">
        <div v-for="(_, index) in section.tuning" :key="index">|</div>
      </div>
      <div class="inline-block">
        <div v-for="(_, index) in section.tuning" :key="index">--</div>
      </div>

      <div
        class="inline-block"
        v-for="(column, index) in section.columns"
        :key="column.id"
        v-memo="[
          column.getStrings().length,
          cursor.columnMemoKey(index),
          isReadOnly && cursor.column === index,
          isDisabled && cursor.column === index,
        ]"
      >
        <TabbyColumn
          @note-selected="(string, active) => onNoteSelected(string, active, index)"
          @column-changed="(column) => onColumnChanged(column, index)"
          @column-deleted="() => onColumnDeleted(index)"
          @insert-column-before="insertColumnBefore"
          @insert-column-after="insertColumnAfter"
          :is-selected="isSelected && cursor.isCurrentColumn(index)"
          :is-read-only="isReadOnly || isDisabled"
          :cursor="cursor"
          :column="column"
        />
      </div>

      <div v-if="!isReadOnly && !isDisabled">
        <div
          v-for="(tuning, index) in section.tuning"
          :key="index"
          @click="createColumn(index + 1, true)"
          class="cursor-pointer text-blue-400 hover:bg-blue-200"
        >
          --
        </div>
      </div>
    </div>
  </div>
</template>
