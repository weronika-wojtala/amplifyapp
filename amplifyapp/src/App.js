import React, { useState, useEffect } from "react";
import "./App.css";
import { API, Storage } from "aws-amplify";
import { withAuthenticator, AmplifySignOut } from "@aws-amplify/ui-react";
import { listNotes, getNote, getUser } from "./graphql/queries";
//import { listUsers } from "./graphql/queries";
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
  createUser as createUserMutation,
} from "./graphql/mutations";
import { AuthState, onAuthUIStateChange } from "@aws-amplify/ui-components";

let username = "";
const initialFormState = { name: "", description: "", userid: "" };

onAuthUIStateChange((nextAuthState, authData) => {
  if (nextAuthState === AuthState.SignedIn) {
    console.log("user successfully signed in!");
    console.log("user data: ", authData);
    username = authData.username;
    //console.log(username);
  }
  if (!authData) {
    console.log("user is not signed in...");
  }
});

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  // async function checkUser(username) {
  //   const apiData = await API.graphql({ query: listUsers });
  //   const notesFromAPI = apiData.data.listUsers.items;

  // }

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    notesFromAPI.filter((note) => note.userid === username);
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const image = await Storage.get(note.image);
          note.image = image;
        }
        return note;
      })
    );
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    // await API.graphql({
    //   query: createNoteMutation,
    //   variables: { input: formData },
    // });
    // console.log(formData);
    // if (formData.image) {
    //   const image = await Storage.get(formData.image);
    //   formData.image = image;
    // }

    // -- TU JEST SPRAWDZENIE CZY W TABELI JEST NOTATKA Z DANYM INDEKSEM, NIE MA WIĘC JEST WSTAWIANA INNA

    // const oneTodo = await API.graphql({
    //   query: getNote,
    //   variables: { id: "1" },
    // });
    // console.log(oneTodo);
    // if (oneTodo.data.getNote === null) {
    //   console.log("Tu jest null");
    //   await API.graphql({
    //     query: createNoteMutation,
    //     variables: {
    //       input: {
    //         name: "Some name",
    //         description: "Some description",
    //         userid: "someUser",
    //       },
    //     },
    //   });
    // }
    //--

    // -- TU JEST SPRAWDZENIE CZY W TABELI JEST USER Z DANYM INDEKSEM, NIE MA WIĘC JEST WSTAWIANY INNY

    const oneTodo = await API.graphql({
      query: getUser,
      variables: { id: "1" },
    });
    console.log(oneTodo);
    if (oneTodo.data.getUser === null) {
      console.log("Tu jest null");
      await API.graphql({
        query: createUserMutation,
        variables: {
          input: {
            id: "1234",
            username: username,
          },
        },
      });
    }
    //--
    setNotes([...notes, formData]);
    setFormData(initialFormState);
  }

  // async function getNote({ id }) {
  //   const apiData = await API.graphql({ query: getNote({ id: id }) });
  // }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter((note) => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  async function onChange(e) {
    if (!e.target.files[0]) return;
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  return (
    <div className="App">
      <h1>{username} Notes App</h1>
      <input
        onChange={(e) =>
          setFormData({ ...formData, name: e.target.value, userid: username })
        }
        placeholder="Note name"
        value={formData.name}
      />
      <input type="file" onChange={onChange} />
      <input
        onChange={(e) =>
          setFormData({
            ...formData,
            description: e.target.value,
          })
        }
        placeholder="Note description"
        value={formData.description}
      />
      <button onClick={createNote}>Create Note</button>
      <div style={{ marginBottom: 30 }}>
        {notes.map((note) => (
          <div key={note.id || note.name}>
            <h2>{note.name}</h2>
            <p>{note.description}</p>
            <button onClick={() => deleteNote(note)}>Delete note</button>
            {note.image && <img src={note.image} style={{ width: 400 }} />}
          </div>
        ))}
      </div>
      <AmplifySignOut />
    </div>
  );
}

//export default App;
export default withAuthenticator(App);
