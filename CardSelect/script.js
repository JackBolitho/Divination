import { Card, CardObj, BurnCost, parsePlayerStats } from '../Data/playInfo.js';

const selectionSection = document.getElementById("selection-section");
let cardObjs = new Map(); //all instantiated cardObjs

function addNewCardToDeck(card)
{
    let playerStatJson = localStorage.getItem('player-stats');
    if(playerStatJson != null)
    {
        //reconstruct player stats
        let playerStats = parsePlayerStats(playerStatJson);

        //add new card to deck
        playerStats.deck.push(card);
        localStorage.setItem('player-stats', JSON.stringify(playerStats));
    }
}

function onMouseClick(e)
{
    const cardEl = e.target.closest('.card');
    if(!cardEl) return;
    const cardObj = cardObjs.get(cardEl);
    addNewCardToDeck(cardObj.card);
}

//renders out selectable cards on screen
function showCards()
{
    const cardChoices = [
        new Card("New CardA", "This is a new card", new BurnCost([-1, 0]), "one_enemy", 3),
        new Card("New CardB", "This is a new card", new BurnCost([-1, 0]), "one_enemy", 3),
        new Card("New CardC", "This is a new card", new BurnCost([-1, 0]), "one_enemy", 3)
    ]

    let xSpacing = 250;
    let startPositionX = (window.innerWidth/2 - 100) - xSpacing * (cardChoices.length-1)/2;
    let startPositionY = window.innerHeight/2 - 135;
    for(let i = 0; i < cardChoices.length; i++)
    {
        let cardObj = new CardObj(cardChoices[i], startPositionX + xSpacing * i, startPositionY);
        selectionSection.appendChild(cardObj.cardEl);
        cardObjs.set(cardObj.cardEl, cardObj);
        cardObj.cardEl.addEventListener("click", onMouseClick);
    }
}

showCards();