@props(["title" => null])

<header>
    <x-logo />
    <div class="titles">
        <h1 id="page-title">{{ $title ?: "Szpiewnik Szybkiego Szukania 3" }}</h1>
        @if ($title)
        <h2>Szpiewnik Szybkiego Szukania 3</h2>
        @endif
    </div>
    <nav class="flex-down but-mobile-right">
    @auth
        <a href="{{ route('songs') }}">Pieśni</a>
        <a href="{{ route('ordinarium') }}">Części stałe</a>
        <a href="{{ route('formulas') }}">Formuły</a>
        <a href="{{ route('places') }}">Miejsca</a>
    @endauth
    </nav>
</header>
