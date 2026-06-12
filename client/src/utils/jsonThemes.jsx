import React from 'react';

export const jsonThemes = {
  "One Dark Pro": {
    text: "#abb2bf",
    key: "#e06c75",
    string: "#98c379",
    number: "#d19a66",
    boolean: "#c678dd",
    null: "#c678dd"
  },
  "Dracula": {
    text: "#f8f8f2",
    key: "#ff79c6",
    string: "#f1fa8c",
    number: "#bd93f9",
    boolean: "#8be9fd",
    null: "#8be9fd"
  },
  "Monokai": {
    text: "#f8f8f2",
    key: "#f92672",
    string: "#e6db74",
    number: "#ae81ff",
    boolean: "#66d9ef",
    null: "#ae81ff"
  },
  "GitHub Dark": {
    text: "#c9d1d9",
    key: "#79c0ff",
    string: "#a5d6ff",
    number: "#79c0ff",
    boolean: "#ff7b72",
    null: "#ff7b72"
  },
  "Nord": {
    text: "#d8dee9",
    key: "#81a1c1",
    string: "#a3be8c",
    number: "#b48ead",
    boolean: "#81a1c1",
    null: "#81a1c1"
  },
  "Solarized Dark": {
    text: "#839496",
    key: "#268bd2",
    string: "#2aa198",
    number: "#d33682",
    boolean: "#b58900",
    null: "#b58900"
  },
  "Night Owl": {
    text: "#d6deeb",
    key: "#c792ea",
    string: "#ecc48d",
    number: "#f78c6c",
    boolean: "#ff5874",
    null: "#ff5874"
  },
  "Catppuccin": {
    text: "#cdd6f4",
    key: "#89b4fa",
    string: "#a6e3a1",
    number: "#fab387",
    boolean: "#cba6f7",
    null: "#f38ba8"
  },
  "Tokyo Night": {
    text: "#a9b1d6",
    key: "#7dcfff",
    string: "#9ece6a",
    number: "#ff9e64",
    boolean: "#bb9af7",
    null: "#bb9af7"
  },
  "Ayu Dark": {
    text: "#b3b1ad",
    key: "#ffb454",
    string: "#c2d94c",
    number: "#f29668",
    boolean: "#f07178",
    null: "#f07178"
  }
};

export const highlightJSON = (jsonString, themeName = "One Dark Pro") => {
    const theme = jsonThemes[themeName] || jsonThemes["One Dark Pro"];
    
    if (jsonString.startsWith('(Returns image/png binary data)')) {
        return <span style={{ color: theme.text }}>{jsonString}</span>;
    }

    const jsonRegex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = jsonRegex.exec(jsonString)) !== null) {
        if (match.index > lastIndex) {
            parts.push(<span key={'text-' + lastIndex} style={{ color: theme.text }}>{jsonString.substring(lastIndex, match.index)}</span>);
        }

        let cls = theme.number; // number
        if (/^"/.test(match[0])) {
            if (/:$/.test(match[0])) {
                cls = theme.key; // key
            } else {
                cls = theme.string; // string
            }
        } else if (/true|false/.test(match[0])) {
            cls = theme.boolean; // boolean
        } else if (/null/.test(match[0])) {
            cls = theme.null; // null
        }

        parts.push(<span key={match.index} style={{ color: cls }}>{match[0]}</span>);
        lastIndex = jsonRegex.lastIndex;
    }

    if (lastIndex < jsonString.length) {
        parts.push(<span key={'text-' + lastIndex} style={{ color: theme.text }}>{jsonString.substring(lastIndex)}</span>);
    }

    return parts;
};
