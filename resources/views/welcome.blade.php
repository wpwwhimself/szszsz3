<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>SZSZSZ3</title>
    </head>
    <body>
        <div class="container" id="root"></div>
        @viteReactRefresh
        @vite(['resources/js/index.tsx'])
    </body>
</html>
