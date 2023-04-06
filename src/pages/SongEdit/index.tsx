import "./style.css";
import { Section } from "../../components/Section";
import { useState } from "react";
import { songs, song_categories } from "../../data";
import { Button, Input, Preferences, Select } from "../../components/Interactives";
import { SelectOption } from "../../types";
import { useLocation, useNavigate } from "react-router-dom";
import { Notation } from "react-abc";
import { slugAndDePL } from "../../helpers";
import axios from "axios";


export function SongEdit(){
  const navigate = useNavigate();
  const title_match: string = useLocation().pathname.replace(/\/songs\/(.*)/, "$1");

  const original_song = songs.filter(soughtSong => slugAndDePL(soughtSong.title) === title_match)[0];
  const song_id = songs.indexOf(original_song);

  const [song, setSong] = useState(songs.filter(soughtSong => slugAndDePL(soughtSong.title) === title_match)[0]);

  const song_categories_proc: SelectOption[] = [];
  song_categories.forEach(item => song_categories_proc.push({key: item.id, label: item.kategoria}));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setSong({ ...song, [name]: value });
  };
  const handlePrefChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let preferences = song.preferences.split("/");
    const { name, checked, value } = event.target;
    if(name === "pref5"){
      preferences[5] = (value) ? value : "0";
    }else{
      preferences[+name.match(/\d/)![0]] = checked ? "1" : "0";
    }
    setSong({ ...song, preferences: preferences.join("/") })
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    axios.post("http://localhost:5000/api/save-song", { song, song_id }).then((response) => {
      console.log(response);
    });
    navigate("/songs");
  };

  return(
    <Section title={`${song.title} | Edycja pieśni`}>
      <h1>Parametry pieśni</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid-3">
          <Input type="text" name="title" label="Tytuł" value={song.title} onChange={handleChange} />
          <Select name="categoryCode" label="Grupa" value={3} options={song_categories_proc} onChange={handleChange} />
          <Input type="text" name="categoryDesc" label="Mini-opis" value={song.categoryDesc ?? ""} onChange={handleChange} />
          <Input type="text" name="numberPreis" label="Numer w projektorze Preis" value={song.numberPreis} onChange={handleChange} />
          <Input type="text" name="key" label="Tonacja" value={song.key} onChange={handleChange} />
          <Preferences preferences={song.preferences ?? "0/0/0/0/0/0"} onChange={handlePrefChange} />
        </div>
        <div className="grid-2">
          <Input type="TEXT" name="lyrics" label="Tekst" value={song.lyrics ?? undefined} onChange={handleChange} />
          <Input type="TEXT" name="sheetMusic" label="Nuty" value={song.sheetMusic ?? undefined} onChange={handleChange} />
        </div>
        <div id="sheet-container" className="flex-right center">
          <Notation notation={song.sheetMusic ?? ""} />
        </div>
        <Button type="submit">Zatwierdź i wróć</Button>
      </form>
    </Section>
  )
}