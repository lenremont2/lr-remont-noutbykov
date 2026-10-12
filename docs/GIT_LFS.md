# Видео и Git LFS

Файлы `*.mp4` и `*.webm` хранятся через Git LFS. Правила записаны в `.gitattributes`; локальные файлы остаются обычными видео.

Перед клонированием установите Git LFS и выполните:

```sh
git lfs install
git clone https://github.com/lenremont2/lr-remont-noutbykov.git
```

В уже существующей копии:

```sh
git lfs install --local
git lfs pull
```

Перед отправкой изменений:

```sh
npm run quality
git push origin master
```

Если клиент отправляет Git с `core.hooksPath=NUL` или `--no-verify`, он пропускает LFS-хук. В таком случае сначала загрузите видео отдельно:

```sh
git lfs push origin master
git -c core.hooksPath=NUL push origin master
```

В среде сборки также должен быть установлен Git LFS и выполнен `git lfs pull` до сборки, чтобы в результат попали видео, а не текстовые указатели.

Если большое видео уже вошло в неопубликованные коммиты обычным Git-файлом, одного нового коммита недостаточно: нужна миграция этих коммитов через `git lfs migrate import`. Опубликованную историю без согласования не переписывайте.
