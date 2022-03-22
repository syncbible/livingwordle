import React, { useState, useEffect } from 'react';
import './App.css';
import verseToDayMapping from './verseToDayMapping';

const KJVPCE = require('./KJVPCE.json');

function App() {
  const [ guesses, setGuesses ] = useState({});
  const [ book, setBook ] = useState(-1);
  const [ chapter, setChapter ] = useState(-1);
  const [ verse, setVerse ] = useState(-1);
  const [ statsShowing, setStatsShowing ] = useState(false);
  const [ readMode, setReadMode ] = useState(false);
  const books = Object.keys( KJVPCE.books );
  const allVerses = books.map( book => KJVPCE.books[ book ].map( ( chapter, chapterNumber ) => chapter.map( ( verse, verseNumber ) => { return { verse, reference: [ book, chapterNumber, verseNumber ] }; } ) ).flat() ).flat();
  const todaysDate = new Date();
  const daysSinceEpoch = Math.floor( todaysDate.getTime() / 1000 / 60 / 60 / 24 );
  const todaysNumber = daysSinceEpoch % allVerses.length;
  const verseNumber = verseToDayMapping[ todaysNumber ];
  const todaysVerse = allVerses[ verseNumber ];
  const todaysReferecence = todaysVerse.reference;

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
    if ( todaysReferecence[ index ] === guessRef[ index ] ) {
      return correctStyle;
    }

    if ( todaysReferecence[ 0 ] === guessRef[ index ] ) {
      return halfCorrectStyle;
    }

    if ( todaysReferecence[ 1 ] === guessRef[ index ] ) {
      return halfCorrectStyle;
    }

    if ( todaysReferecence[ 2 ] === guessRef[ index ] ) {
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

  const getStats = () => {
    const stats = Object.keys( guesses ).map( guess => {
      return guesses[guess].length;
    } );
    const largestNumber = Math.max(...stats);
    const statCountArray = [];

    for( var i = 1; i < largestNumber + 1 ; i++ ) {
      statCountArray.push( i );
    }

    const list = statCountArray.map( count => {
      const numberOfStat = stats.filter( stat => stat === count ).length;
      const width = ( numberOfStat / stats.length ) * 100;
      return ( <li key={ count } className="stat" style={{ width: width + '%' }}>{ numberOfStat }</li> );
    } );

    return (
      <>
        <h1>The Living Wordle: Stats</h1>
        <ol className="stats">{ list }</ol>
        <p><a href="#" onClick={ () => setStatsShowing( false ) }>Hide</a></p>
      </>
    );
  }

  const shareButton = () => {
    return (
      <a href="#" onClick={ ( event ) => copySharingText( event ) }>Share</a>
    );
  };

  const urlOfVerse = 'https://sync.bible/#/KJV/' + todaysVerse.reference[0] + '/' + ( todaysVerse.reference[1] + 1 ) + '/' + ( todaysVerse.reference[2] + 1 );

  const getVerse = ( verse, index, selected ) => (
    <p className={ selected ? 'selected' : '' }>
      { index ? index + '. ' : '' } { verse.map( ( words, key ) => (
        <span key={ key } className={ words[ 1 ] }>{ words[ 0 ] + ' ' }</span>
      ) ) }
    </p>
  );

  const wholeChapter = (
      <div className="whole-chapter">
        <h1>{ todaysReferecence[0] } { todaysReferecence[1] + 1 }</h1>
        { KJVPCE.books[ todaysReferecence[0] ][ todaysReferecence[1] ].map( ( verse, index ) => getVerse( verse, index + 1, index === todaysReferecence[2] ) ) }
        <p><a href="#" onClick={ () => setReadMode( false ) }>Hide</a> • <a href={ urlOfVerse }>Read more</a></p>
      </div>
  );

  const readButton = (
    <a href="#" onClick={ ()=>setReadMode( true ) }>Read</a>
  );

  const content = (
    <>
    <h1>The Living Wordle</h1>
    { getVerse( todaysVerse.verse, null, false ) }
    { guesses && guesses[ daysSinceEpoch ] && guesses[ daysSinceEpoch ].map( ( guess, index ) => {
      const difference = guess - verseNumber;
      const guessRef = allVerses[ guess ].reference;

      return (
        <div key={ index } className="guess wrapper">
          <span className="book" title={ guessRef[0] } style={ getStyle( guessRef, 0 ) }>{ guessRef[0] }</span>
          <span className="chapter" style={ getStyle( guessRef, 1 ) }>{ guessRef[1] + 1 }</span>
          <span className="verse" style={ getStyle( guessRef, 2 ) }>{ guessRef[2] + 1 }</span>
          <span className="button" style={ difference === 0 ? correctStyle : {} } title={ Math.abs( difference ) + ' verses away' }>{ difference === 0 ? '✓' : difference > 0 ? '← ' + Math.abs( difference ) : Math.abs( difference ) + ' →'  }</span>
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
    { isAnyGuessCorrect() && <p>{ readButton } • { shareButton() } • <a href="#" onClick={ () => setStatsShowing(true) }>Stats</a></p> }
    </>
  )

  const getContent = () => {
    if ( statsShowing ) {
      return getStats();
    }

    if ( readMode ) {
      return wholeChapter
    }

    return content;
  }

  return (
    <div className="App">
      <header className="App-header">
        { getContent() }
      </header>
    </div>
  );
}

export default App;
