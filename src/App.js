import React, { useState, useEffect } from 'react';
import './App.css';
import verseToDayMapping from './verseToDayMapping';

const KJVPCE = require('./KJVPCE.json');

function App() {
  const [ guesses, setGuesses ] = useState({});
  const [ book, setBook ] = useState(-1);
  const [ chapter, setChapter ] = useState(-1);
  const [ verse, setVerse ] = useState(-1);
  const books = Object.keys( KJVPCE.books );
  const allVerses = books.map( book => KJVPCE.books[ book ].map( ( chapter, chapterNumber ) => chapter.map( ( verse, verseNumber ) => { return { verse, reference: [ book, chapterNumber, verseNumber ] }; } ) ).flat() ).flat();
  const todaysDate = new Date();
  const daysSinceEpoch = Math.floor( todaysDate.getTime() / 1000 / 60 / 60 / 24 );
  const todaysNumber = daysSinceEpoch % allVerses.length;
  const verseNumber = verseToDayMapping[ todaysNumber ];
  const todaysVerse = allVerses[ verseNumber ];

  useEffect(() => {
    const guesses = JSON.parse( localStorage.getItem('guesses') );
    if ( guesses ) {
      setGuesses( guesses );
    }
  }, []);

  useEffect( () => {
    localStorage.setItem( 'guesses', JSON.stringify( guesses ) );
  }, [ guesses ] );

  const submitForm = ( event ) => {
    event.preventDefault();
    const guessNumber = allVerses.findIndex( ( { reference } ) => reference[0] === book && reference[1] === chapter && reference[2] === verse );
    const newGuesses = { ...guesses };
    if ( ! guesses[ daysSinceEpoch ] ) {
      newGuesses[ daysSinceEpoch ] = [ guessNumber ];
    } else {
      newGuesses[ daysSinceEpoch ] = [ ...guesses[ daysSinceEpoch ], guessNumber ];
    }
    setGuesses( newGuesses );
  }

  const correctStyle = { background: "#393" };
  const halfCorrectStyle = { background: "#c93" };

  function getStyle( guessRef, index ) {
    if ( todaysVerse.reference[ index ] === guessRef[ index ] ) {
      return correctStyle;
    }

    if ( todaysVerse.reference[ 0 ] === guessRef[ index ] ) {
      return halfCorrectStyle;
    }

    if ( todaysVerse.reference[ 1 ] === guessRef[ index ] ) {
      return halfCorrectStyle;
    }

    if ( todaysVerse.reference[ 2 ] === guessRef[ index ] ) {
      return halfCorrectStyle;
    }
  }

  const isAnyGuessCorrect = () => {
    const correctGuesses = guesses && guesses[ daysSinceEpoch ] && guesses[ daysSinceEpoch ].filter( ( guess, index ) => {
      return guess - verseNumber === 0;
    } );

    return correctGuesses && correctGuesses.length > 0;
  }

  const getSharingText = () => {
    if ( guesses && guesses[ daysSinceEpoch ] ) {
      const sharingText = guesses[ daysSinceEpoch ].map( ( guess ) => {
        const guessRef = allVerses[ guess ].reference;

        return guessRef.map( ( guessRefItem, index ) => {
          if ( guessRefItem === todaysVerse.reference[ index ] ) {
              return '🟩';
          }

          if ( guessRefItem === todaysVerse.reference[ 1 ] ) {
            if ( index === 1 ) {
              return '🟩';
            }
            if ( index === 2 ) {
              return '🟧';
            }
          }

          if ( guessRefItem === todaysVerse.reference[ 2 ] ) {
            if ( index === 2 ) {
              return '🟩';
            }
            if ( index === 1 ) {
              return '🟧';
            }
          }

          return '⬛'
        } ).join('');
      } ).join('\r\n');

      return 'The Living Wordle ' + todaysDate.getFullYear() + '-' + ( todaysDate.getMonth() + 1 ) + '-' + todaysDate.getDate() + '\r\n' + sharingText;
    }
  };

  const copySharingText = ( event ) => {
    event.preventDefault();
    const textarea = document.createElement( 'textarea' )
    textarea.value = getSharingText();
    document.body.appendChild( textarea );
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    event.target.focus();

    /* Alert the copied text */
    alert("Copied to clipboard:\r\n" + getSharingText() );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>The Living Wordle</h1>
        <p>{ todaysVerse.verse.map( words => words[ 0 ]).join(' ') }</p>
        { guesses && guesses[ daysSinceEpoch ] && guesses[ daysSinceEpoch ].map( ( guess, index ) => {
          const difference = guess - verseNumber;
          const guessRef = allVerses[ guess ].reference;

          const shareButton = () => {
            return (
              <a href="#" onClick={ ( event ) => copySharingText( event ) }>✓ Share</a>
            );
          };

          return (
            <div key={ index } className="guess wrapper">
              <span className="book" title={ guessRef[0] } style={ getStyle( guessRef, 0 ) }>{ guessRef[0] }</span>
              <span className="chapter" style={ getStyle( guessRef, 1 ) }>{ guessRef[1] + 1 }</span>
              <span className="verse" style={ getStyle( guessRef, 2 ) }>{ guessRef[2] + 1 }</span>
              <span className="button" style={ difference === 0 ? correctStyle : {} } title={ Math.abs( difference ) + ' verses away' }>{ difference === 0 ? shareButton() : difference > 0 ? '← ' + Math.abs( difference ) : Math.abs( difference ) + ' →'  }</span>
            </div>
          );
        } ) }
        { ! isAnyGuessCorrect() && <form className="wrapper" onSubmit={ submitForm }>
          <span className="book">
          <select name="book" onChange={( event )=>{ setBook( event.target.value)} }>
            <option>Book</option>
            { books.map( ( book, index ) => {
              return <option key={index}>{ book }</option>
            } ) }
          </select>
          </span>
          <span className="chapter">
          <select name="chapter" onChange={( event )=>{ setChapter( parseInt( event.target.value ) ) } }>
            <option>Chapter</option>
            { KJVPCE.books[ book ] && KJVPCE.books[ book ].map( ( chapters, index ) => {
              return <option key={index} value={ index }>{ index + 1 }</option>
            } ) }
          </select>
          </span>
          <span className="verse">
          <select name="verse" onChange={( event )=>{ setVerse( parseInt( event.target.value) ) } }>
            <option>Verse</option>
            { KJVPCE.books[ book ] && KJVPCE.books[ book ][ chapter ] && KJVPCE.books[ book ][ chapter ].map( ( verses, index ) => {
              return <option key={index} value={ index }>{ index + 1 }</option>
            } ) }
          </select>
          </span>
          <span className="button">
            <input type="submit" value="Guess" disabled={ verse < 0 } />
          </span>
        </form> }
      </header>
    </div>
  );
}

export default App;
