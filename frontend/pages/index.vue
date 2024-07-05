<template>
  <main>
    <h1>
      <Icon name="tabler:user-bolt" /><span>Chats</span>
    </h1>
    <div class="content">
      <Table>
        <TableHeader class="select-none">
          <TableRow>
            <TableHead class="w-16">
              Foto
            </TableHead>
            <TableHead>
              Nombre
            </TableHead>
            <TableHead>Celular</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead class="text-right">
              Estado
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="chat in chats">
            <TableCell class="font-medium">
              <Avatar>
                <AvatarImage preload :src="`${back_url}/ppic/${chat.id.split('@')[0]}.webp`" draggable="false" />
              </Avatar>
            </TableCell>
            <TableCell class="font-medium leading-none">
              {{ chat.name }}
            </TableCell>
            <TableCell>+{{ chat.id.split("@")[0] }}</TableCell>
            <TableCell>{{ chat.notes ?? "Ninguna..." }}</TableCell>
            <TableCell class="text-right">
              <Switch :defaultChecked="Boolean(chat.enabled)" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

    </div>
  </main>
</template>
<script setup lang="ts">
  import { Switch } from '@/components/ui/switch'
  import AvatarImage from '~/components/ui/avatar/AvatarImage.vue';
  definePageMeta({
    title: 'Chats',
  })
  type Chat = {
    name: string,
    id: string,
    enabled: boolean,
    notes: string | null
  }

  const { back_url } = useRuntimeConfig().public;
  let chats = ref < Chat[] > ([]);

  async function getData() {
    const response = await fetch(`${back_url}/api/db/chats`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      }
    });
    const data = await response.json();
    chats.value = data;
  }

  onBeforeMount(() => getData());
</script>
<style>
  table {
    & thead tr {
      & th:first-child {
        @apply rounded-tl-xl;
      }

      & th:last-child {
        @apply rounded-tr-xl;
      }
    }

    & tbody:last-child {
      & td:first-child {
        @apply rounded-bl-xl;
      }

      & td:last-child {
        @apply rounded-br-xl;
      }
    }
  }
</style>