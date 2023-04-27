import React, { useEffect } from "react";
import { createContext, useState } from "react";
import { massOrder, baseFormula } from "../helpers";
import { Button, Input, Select } from "../components/Interactives";
import { AddCollectorProps, Extra, Formula, HandleAddCollectorProps, MModProps, MassElem, OrdinariumColorProps, OrdinariumProps, SelectOption, Set, SongProps } from "../types";
import { ExtrasProcessor, MassElemSection, OrdinariumProcessor, PsalmLyrics, SongLyrics } from "../components/MassElements";
import { SheetMusicRender } from "../components/SheetMusicRender";
import axios from "axios";

export const MModContext = createContext({} as MModProps);

export function MassSet(){
    const set_id = +window.location.href.replace(/.*\/(\d+)/, "$1");

    const [set, setSet] = useState({} as Set);
    const [ordinarium, setOrdinarium] = useState([] as OrdinariumProps[]);
    const [ordinarius_colors, setOrdColors] = useState([] as OrdinariumColorProps[]);
    const [formula, setFormula] = useState({} as Formula);
    const [songs, setSongs] = useState([] as SongProps[]);

    const [addCollector, setAddCollector] = useState({song: undefined, before: undefined} as AddCollectorProps);

    useEffect(() => {
        axios.get("/api/set-data", {params: {set_id: set_id}}).then(res => {
            setSet(res.data.set);
            setOrdinarium(res.data.ordinarium);
            setOrdColors(res.data.ordinarius_colors);
            setFormula(res.data.formula);
            setSongs(res.data.songs);
        });
    }, []);

    // loader
    if(songs.length === 0){
        return <h2>Wczytuję...</h2>;
    }

    const ordColorOptions: SelectOption[] = [];
    ordinarius_colors.forEach(color => ordColorOptions.push({ value: color.name, label: color.display_name }));
    const handleColorChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        setSet({ ...set, color: ev.target.value });
    }
    const thisMassOrdinarium = ordinarium.filter(el => el.color_code === set.color);

    // This mass' order
    let thisMassOrder: MassElem[] = [];
    massOrder.map(el => thisMassOrder.push({
        code: el.value as string,
        label: el.label,
        content: set[el.value as keyof Set] as string,
    }));

    //splitting comunnion songs
    const com = thisMassOrder.filter(el => el.code === "sCommunion")[0];
    com.content!.split(/\r\n/).forEach((title, i) => {
        thisMassOrder.splice(
            thisMassOrder.indexOf(com),
            0,
            { code: `${com.code}${i}`, label: com.label, content: title }
        );
    });
    thisMassOrder.splice(thisMassOrder.indexOf(com), 1);

    //formula modifications
    const formulaInsertExtras = (extra: Extra, massOrder: MassElem[]) => {
        const pre = massOrder.filter(el2 => el2.code === extra.before)[0];
        const addition = (extra.name.charAt(0) === "x") ?
            { code: `${extra.name}`, label: `Zanim nastąpi ${pre.label}`, content: undefined } :
            { code: `sB4${extra.before}`, label: `Zanim nastąpi ${pre.label}`, content: extra.name };
        if(pre) thisMassOrder.splice(
            thisMassOrder.indexOf(pre),
            (extra.replace) ? 1 : 0,
            addition
        );
        else thisMassOrder.push({ code: `sOutro`, label: `Dodatkowo`, content: extra.name });
    }

    if(!formula.gloria_present) thisMassOrder = thisMassOrder.filter(el => el.code !== "oGloria");
    formula.extra?.forEach((el) => {
        formulaInsertExtras(el, thisMassOrder);
    });

    if(set.thisMassOrder === undefined) setSet({...set, thisMassOrder: thisMassOrder});

    const Mass = set.thisMassOrder?.map<React.ReactNode>((el, i) => {
        switch(el.code.charAt(0)){
            case "s": // song
            const song = songs.filter(s => s.title === el.content)[0];
            return(
                <MassElemSection id={el.code} key={i}>
                    <div className="songMeta">
                        <h2>{el.label}</h2>
                        <h1>{el.content}</h1>
                        <div className="flex-right center">
                        {song ?
                          <>
                            <Input type="text" name="" label="Tonacja" value={song.key} disabled />
                            <Input type="text" name="" label="Kategoria" value={song.category_desc} disabled />
                            <Input type="text" name="" label="Numer w śpiewniku Preis" value={song.number_preis} disabled />
                          </>
                          :
                          <p>Pieśń niezapisana</p>
                        }
                        </div>

                        {song?.sheet_music && <SheetMusicRender notes={song.sheet_music} />}
                        {song?.lyrics && <SongLyrics lyrics={song.lyrics} />}
                    </div>
                </MassElemSection>
            )
        case "p": // psalm
            const part = thisMassOrdinarium.filter(el2 => el2.part === el.label.toLocaleLowerCase())[0];
            const formulaPart = ordinarium
                .filter(el2 => el2.color_code === baseFormula(formula.name))
                .filter(el2 => el2.part === el.label.toLocaleLowerCase())[0];
            const isNotWielkiPostAklamacja = !(baseFormula(set.formula) === "Wielki Post" && el.code === "pAccl");
            return(
                <MassElemSection id={el.code} key={i}>
                    <h1>{el.label}</h1>
                    {isNotWielkiPostAklamacja && <SheetMusicRender notes={part.sheet_music} />}
                    {formulaPart && <SheetMusicRender notes={formulaPart.sheet_music} />}
                    <PsalmLyrics lyrics={el.content!} />
                </MassElemSection>
            )
        case "o": // ordinarius
            return(
                <MassElemSection id={el.code} key={i}>
                    <OrdinariumProcessor code={el.code} colorCode={set.color} />
                </MassElemSection>
            )
        default:
            return(
                <MassElemSection id={el.code} key={i}>
                    <ExtrasProcessor elem={el} />
                </MassElemSection>
            )
        }
    });

    //deleting
    const MMod: MModProps = {
        prepareMassElemErase: (id) => {
            const hide = id.charAt(0) === "!";
            if(hide) id = id.substring(1);
            document.querySelector<HTMLElement>(`#${id} .massElemEraser button:nth-child(1)`)!.style.display = (hide) ? "none" : "block";
        },
        eraseMassElem: (id) => {
            thisMassOrder = set.thisMassOrder!.filter(el => el.code !== id);
            setSet({...set, thisMassOrder: thisMassOrder});
        }
    }

    //adding
    function addModeOn(useCollector: boolean = false){
        if(useCollector){
            const newMassOrder = thisMassOrder;
            formulaInsertExtras(
                {
                    name: addCollector.song,
                    before: addCollector.before,
                    replace: false
                } as Extra,
                newMassOrder
            );
            setSet({...set, thisMassOrder: newMassOrder});
        }
        setAddCollector({} as AddCollectorProps);
        document.getElementById("adder")!.classList.toggle("addmode");
    }
    const handleAddCollector: HandleAddCollectorProps = (updatingField, value) => {
        setAddCollector({...addCollector, [updatingField]: value});
    }

    // Mass' summary
    const summary = set.thisMassOrder
        ?.filter(el => el.content !== undefined)
        .filter(el => el.code !== "pAccl");

    return(<>
        <div className="flex-right center wrap settings">
            <Select name="color" label="Kolor cz.st." options={ordColorOptions} value={set.color} onChange={handleColorChange}/>
            {summary?.map((el, i) =>
                <Button key={i}
                    onClick={() => document.getElementById(el.code)?.scrollIntoView({behavior: "smooth", block: "center"})}
                    >
                    {el.label.substring(0, 3)}
                </Button>
            )}
            <Button onClick={() => addModeOn()}>+</Button>
        </div>

        <div id="adder">
            <h1>Dodaj pieśń</h1>
            <h2>Wybierz tytuł</h2>
            <div id="song-list" className="flex-right center wrap">
            {songs.map((song, i) =>
                <Button key={i}
                    onClick={() => handleAddCollector("song", song.title)}
                    className={`light-button ${addCollector.song === song.title && "accent-border"}`}
                    >
                    {song.title}
                </Button>
            )}
            </div>
            <h2>Wstaw przed:</h2>
            <div className="flex-right center wrap">
            {thisMassOrder.map((el, i) =>
                <Button key={i}
                    onClick={() => handleAddCollector("before", el.code)}
                    className={`light-button ${addCollector.before === el.code && "accent-border"}`}
                    >
                    {el.label}
                </Button>
            )}
            </div>
            <div className="flex-right stretch">
                <Button onClick={() => addModeOn()}>Anuluj</Button>
                {addCollector.song && addCollector.before && <Button onClick={() => addModeOn(true)}>Dodaj</Button>}
            </div>
        </div>

        <div className="flex-down">
            <MModContext.Provider value={MMod}>
                <MassElemSection id="summary" uneresable>
                    <h1>Skrót</h1>
                    <div className="grid-2">
                        <div>
                            <h2>Meta</h2>
                            <div className="flex-right wrap center">
                                <Input type="text" name="" label="Formuła" disabled value={set.formula} />
                                {/* <Input type="text" name="" label="Utworzony" disabled value={set.createdAt} /> */}
                            </div>
                        </div>
                        <div>
                            <h2>Pieśni i psalm</h2>
                            <ol className="summary">
                            {summary?.map((el, i) =>
                                <li key={i}>
                                    <b>{
                                        (el.content!.indexOf("\n") > -1) ?
                                        el.content!.substring(0, el.content!.indexOf("\n")) :
                                        el.content
                                    }</b>
                                    <span>{el.label}</span>
                                </li>
                            )}
                            </ol>
                        </div>
                    </div>
                </MassElemSection>
                {Mass}
            </MModContext.Provider>
        </div>
    </>)
}
