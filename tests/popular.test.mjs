import test from 'node:test';
import assert from 'node:assert/strict';
import { rankArticles } from '../scripts/fetch-popular.mjs';

const known = new Set(['a', 'b', 'c']);

test('閲覧数の多い順に並べる', () => {
  const rows = [
    { path: '/yorozuya/articles/a/', views: '5' },
    { path: '/yorozuya/articles/b/', views: '12' },
    { path: '/yorozuya/articles/c/', views: '7' },
  ];
  assert.deepEqual(rankArticles(rows, known).map((x) => x.path),
    ['/yorozuya/articles/b/', '/yorozuya/articles/c/', '/yorozuya/articles/a/']);
});

test('末尾の / や index.html の違いは同じ記事として足す', () => {
  const rows = [
    { path: '/yorozuya/articles/a', views: '3' },
    { path: '/yorozuya/articles/a/index.html', views: '4' },
    { path: '/yorozuya/articles/a/?utm_source=x', views: '2' },
    { path: '/yorozuya/articles/b/', views: '8' },
  ];
  assert.deepEqual(rankArticles(rows, known), [
    { path: '/yorozuya/articles/a/', views: 9 },
    { path: '/yorozuya/articles/b/', views: 8 },
  ]);
});

test('今ない記事・記事より下の階層・閲覧0は捨てる', () => {
  const rows = [
    { path: '/yorozuya/articles/gone/', views: '50' },
    { path: '/yorozuya/articles/a/img/x.webp', views: '50' },
    { path: '/yorozuya/articles/', views: '50' },
    { path: '/yorozuya/articles/c/', views: '0' },
    { path: '/yorozuya/articles/b/', views: '1' },
  ];
  assert.deepEqual(rankArticles(rows, known), [{ path: '/yorozuya/articles/b/', views: 1 }]);
});

test('同じ閲覧数ならパスの順（毎日の並びが揺れない）', () => {
  const rows = [{ path: '/yorozuya/articles/c/', views: '4' }, { path: '/yorozuya/articles/a/', views: '4' }];
  assert.deepEqual(rankArticles(rows, known).map((x) => x.path), ['/yorozuya/articles/a/', '/yorozuya/articles/c/']);
});
