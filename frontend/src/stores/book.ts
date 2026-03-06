import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';

export interface ChapterVersion {
  id: string;
  chapterId: string;
  content: string;
  version: number;
  createdAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  content?: string;
  wordCount: number;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  order: number;
  bookId: string;
  volumeId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  versions?: ChapterVersion[];
}

export interface Volume {
  id: string;
  title: string;
  order: number;
  bookId: string;
  chapters?: Chapter[];
}

export interface Outline {
  id: string;
  title: string;
  content?: string | null;
  order: number;
}

export interface Character {
  id: string;
  name: string;
  role?: string | null;
  avatar?: string | null;
  bio?: string | null;
}

export interface Inspiration {
  id: string;
  title: string;
  content: string;
  tags: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  cover?: string;
  description?: string;
  status: 'DRAFT' | 'SERIAL' | 'FINISHED';
  wordCount: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  chapters?: Chapter[];
  volumes?: Volume[];
  outlines?: Outline[];
  characters?: Character[];
  inspirations?: Inspiration[];
  _count?: {
    chapters: number;
    characters: number;
    inspirations: number;
    outlines?: number;
  };
}

export interface BookStats {
  totalBooks: number;
  totalWords: number;
  totalChapters: number;
  serialBooks: number;
  finishedBooks: number;
}

export interface WritingStats {
  todayWordCount: number;
  totalWordCount: number;
  streakDays: number;
  activeDays: number;
  last7Days: Array<{ date: string; wordCount: number }>;
  today: string;
}

export const useBookStore = defineStore('book', () => {
  const books = ref<Book[]>([]);
  const currentBook = ref<Book | null>(null);
  const isLoading = ref(false);
  let loadingCount = 0;  // 引用计数，解决并发请求竞态
  const stats = ref<BookStats | null>(null);
  const writingStats = ref<WritingStats | null>(null);

  const ungroupedChapters = computed(() =>
    (currentBook.value?.chapters || []).filter((chapter) => !chapter.volumeId),
  );

  async function fetchBooks() {
    loadingCount++;
    isLoading.value = true;
    try {
      books.value = await apiGet<Book[]>('/books');
      return books.value;
    } finally {
      loadingCount--;
      if (loadingCount <= 0) { loadingCount = 0; isLoading.value = false; }
    }
  }

  async function fetchBook(id: string) {
    loadingCount++;
    isLoading.value = true;
    try {
      currentBook.value = await apiGet<Book>(`/books/${id}`);
      return currentBook.value;
    } finally {
      loadingCount--;
      if (loadingCount <= 0) { loadingCount = 0; isLoading.value = false; }
    }
  }

  async function createBook(data: { title?: string; description?: string; cover?: string }) {
    const created = await apiPost<Book>('/books', data);
    books.value.unshift(created);
    return created;
  }

  async function updateBook(
    id: string,
    data: { title?: string; description?: string; cover?: string; status?: string },
  ) {
    const updated = await apiPut<Book>(`/books/${id}`, data);

    const idx = books.value.findIndex((book) => book.id === id);
    if (idx >= 0) {
      books.value[idx] = { ...books.value[idx], ...updated };
    }
    if (currentBook.value?.id === id) {
      currentBook.value = { ...currentBook.value, ...updated };
    }
    return updated;
  }

  async function deleteBook(id: string) {
    await apiDelete(`/books/${id}`);
    books.value = books.value.filter((book) => book.id !== id);
    if (currentBook.value?.id === id) {
      currentBook.value = null;
    }
    return true;
  }

  async function fetchStats() {
    try {
      stats.value = await apiGet<BookStats>('/books/stats');
    } catch (err) {
      console.error('获取统计失败:', err);
    }
    return stats.value;
  }

  async function fetchWritingStats(days: number = 7) {
    try {
      writingStats.value = await apiGet<WritingStats>(`/stats?days=${days}`);
    } catch (err) {
      console.error('获取写作统计失败:', err);
    }
    return writingStats.value;
  }

  async function createChapter(bookId: string, data: { title?: string; volumeId?: string }) {
    const chapter = await apiPost<Chapter>(`/books/${bookId}/chapters`, data);
    if (currentBook.value?.id === bookId) {
      await fetchBook(bookId);
    }
    return chapter;
  }

  async function fetchChapter(chapterId: string) {
    return apiGet<Chapter>(`/chapters/${chapterId}`);
  }

  async function saveChapter(chapterId: string, data: { title?: string; content?: string }) {
    const updated = await apiPut<Chapter>('/chapters/save', {
      chapter_id: chapterId,
      ...data,
    });

    if (currentBook.value) {
      const chapters = currentBook.value.chapters || [];
      const index = chapters.findIndex((chapter) => chapter.id === chapterId);
      if (index >= 0) {
        chapters[index] = { ...chapters[index], ...updated };
      }
      await fetchBook(currentBook.value.id);
    }

    return updated;
  }

  async function updateChapter(
    chapterId: string,
    data: { title?: string; content?: string; status?: string; volumeId?: string | null },
  ) {
    if (data.content !== undefined || data.title !== undefined) {
      return saveChapter(chapterId, { title: data.title, content: data.content });
    }

    const updated = await apiPut<Chapter>(
      `/books/${currentBook.value?.id}/chapters/${chapterId}`,
      data,
    );
    if (currentBook.value) {
      await fetchBook(currentBook.value.id);
    }
    return updated;
  }

  async function deleteChapter(chapterId: string) {
    await apiDelete(`/books/${currentBook.value?.id}/chapters/${chapterId}`);
    if (currentBook.value) {
      await fetchBook(currentBook.value.id);
    }
    return true;
  }

  async function publishChapter(chapterId: string) {
    const updated = await apiPost<Chapter>('/chapters/publish', { chapter_id: chapterId });
    if (currentBook.value) {
      await fetchBook(currentBook.value.id);
    }
    return updated;
  }

  async function scheduleChapter(chapterId: string, publishAt: string) {
    const updated = await apiPost<Chapter>('/chapters/schedule', {
      chapter_id: chapterId,
      publish_at: publishAt,
    });
    if (currentBook.value) {
      await fetchBook(currentBook.value.id);
    }
    return updated;
  }

  async function fetchChapterHistory(chapterId: string) {
    return apiGet<ChapterVersion[]>(`/chapters/history/${chapterId}`);
  }

  async function rollbackChapter(chapterId: string, versionId: string) {
    const chapter = await apiPost<Chapter>('/chapters/rollback', {
      chapter_id: chapterId,
      version_id: versionId,
    });
    if (currentBook.value) {
      await fetchBook(currentBook.value.id);
    }
    return chapter;
  }

  async function reorderChapters(
    bookId: string,
    chapters: { id: string; order: number; volumeId?: string | null }[],
  ) {
    await apiPost('/chapters/reorder', {
      book_id: bookId,
      chapters: chapters.map((item) => ({
        id: item.id,
        order: item.order,
        volume_id: item.volumeId,
      })),
    });
    if (currentBook.value?.id === bookId) {
      await fetchBook(bookId);
    }
    return true;
  }

  async function createVolume(bookId: string, data: { title?: string }) {
    const volume = await apiPost<Volume>(`/books/${bookId}/volumes`, data);
    if (currentBook.value?.id === bookId) {
      await fetchBook(bookId);
    }
    return volume;
  }

  async function createOutline(bookId: string, data: { title: string; content?: string }) {
    const outline = await apiPost<Outline>(`/books/${bookId}/outlines`, data);
    if (currentBook.value?.id === bookId) {
      await fetchBook(bookId);
    }
    return outline;
  }

  async function createCharacter(
    bookId: string,
    data: { name: string; role?: string; bio?: string },
  ) {
    const character = await apiPost<Character>(`/books/${bookId}/characters`, data);
    if (currentBook.value?.id === bookId) {
      await fetchBook(bookId);
    }
    return character;
  }

  async function createInspiration(
    bookId: string,
    data: { title: string; content: string; tags?: string[] },
  ) {
    const inspiration = await apiPost<Inspiration>(`/books/${bookId}/inspirations`, data);
    if (currentBook.value?.id === bookId) {
      await fetchBook(bookId);
    }
    return inspiration;
  }

  return {
    books,
    currentBook,
    isLoading,
    stats,
    writingStats,
    ungroupedChapters,
    fetchBooks,
    fetchBook,
    createBook,
    updateBook,
    deleteBook,
    fetchStats,
    fetchWritingStats,
    createChapter,
    fetchChapter,
    saveChapter,
    updateChapter,
    deleteChapter,
    publishChapter,
    scheduleChapter,
    fetchChapterHistory,
    rollbackChapter,
    reorderChapters,
    createVolume,
    createOutline,
    createCharacter,
    createInspiration,
  };
});
