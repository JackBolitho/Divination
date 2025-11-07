//contains all information for card stats
class Card
{
    /*
        possible targets:
            "one_enemy"
            "all_enemies"
            "self"
    */
    constructor(name, description, burnCost, target, damage)
    {
        this.name = name;
        this.burnCost = burnCost;
        
        //card stats
        this.target = target;
        this.damage = damage;

        if(description == "*"){
            this.createDescription();
        }else{
            this.description = description;
        }
    }

    createDescription()
    {
        this.description = "";
        if(this.damage > 0){
            this.description += "Deal " + this.damage + " damage. ";
        }
    }
}

//holds the burn cost, and a way to get the indices of the cards to burn
class BurnCost
{
    //burnString gives the indices representing which cards are discarded when a card is played
    //[-2, -1, 0, 1, 2] - burn the card 2 to the left, 1 to the left, the card itself, 1 to the right, and 2 to the right
    constructor(burnArray)
    {
        this.burnArray = burnArray;
    }

    //either returns the indicies to burn when a card is played, or null when the card cannot be played
    getIndicesToBurn(indexInHand, handLength)
    {
        const arrayCopy = [...this.burnArray];
        for(let i = 0; i < arrayCopy.length; i++){
            arrayCopy[i] += indexInHand;

            //exit early when card cannot be played, insufficient cost
            if(arrayCopy[i] < 0 || arrayCopy[i] >= handLength)
            {
                return null;
            }
        }
        return arrayCopy;
    }
}

//stores card element, card stats, and position data
class CardObj
{
    constructor(card, startX, startY)
    {
        //instantiate card values
        this.cardEl = document.createElement('div');
        this.cardEl.setAttribute('class', 'card');
        this.cardEl.innerHTML = `
                <p class="card-name">${card.name}</p>
                <div class="card-image"></div>
                <p class="card-body">${card.description}</p>
        `
        this.cardEl.style.top = startY + 'px';
        this.cardEl.style.left = startX + 'px';

        //add listeners
        this.cardEl.addEventListener('mousedown', mouseDownOnCard);
        this.cardEl.addEventListener('mouseover', onCardHover);
        this.card = card;
        
        //movement position information
        this.startX = startX;   
        this.newX = startX;
        this.startY = startY;
        this.newY = startY;

        //hand position information
        this.handposX = 0;
        this.handposY = 0;
        this.handRotation = 0;
        this.handZPos = 0;

        this.cardGrabbed = false;
        this.canBePlayed = false;
        this.canBeHovered = true;
    }
}

class Player
{
    constructor(name, health)
    {
        this.name = name;
        this.maxHealth = health;
        this.currHealth = health;

        //elements
        this.healthText = document.getElementById("health-text");
        this.healthText.innerText = "Health: " + this.currHealth + "/" + this.maxHealth;
    }

    takeDamage(damage)
    {
        this.currHealth -= damage;
        if(this.currHealth <= 0){
            this.currHealth = 0;
            gameOver();
        }
        this.healthText.innerText = "Health: " + this.currHealth + "/" + this.maxHealth;
    }
}

//contains all stats for an enemy
class Enemy
{
    constructor(name, health, actions)
    {
        this.name = name;
        this.maxHealth = health;
        this.currHealth = health;
        this.actions = actions;
    }
}


//contains the possible actions an enemy could perform
class EnemyAction
{   
    constructor(name, damage)
    {
        this.name = name;
        this.damage = damage;
    }
}

//an object wrapper that also contains the element
class EnemyObj
{
    constructor(enemy, xPos, yPos)
    {
        this.enemy = enemy;
        this.nextAction = null;

        //instantiate card values
        this.enemyEl = document.createElement('div');
        this.enemyEl.setAttribute('class', 'enemy');
        this.enemyEl.innerHTML = `
            <p class="enemy-name">Name</p>
            <p class="enemy-health">Health: X</p>
            <p class="enemy-attack">Upcoming Attack: X</p>
        ` //set later if need be
        this.enemyEl.style.top = yPos + 'px';
        this.enemyEl.style.left = xPos + 'px';

        //get elements
        this.nameText = this.enemyEl.querySelector('.enemy-name');
        this.healthText = this.enemyEl.querySelector('.enemy-health');
        this.upcomingAttackText = this.enemyEl.querySelector('.enemy-attack');

        //set elements
        this.nameText.innerText = enemy.name;
        this.healthText.innerText = "Health: " + enemy.currHealth + "/" + enemy.maxHealth;
        this.upcomingAttackText.innerText = "";

        this.blockedDamage = 0;
    }

    takeDamage(damage)
    {
        this.enemy.currHealth -= damage;
        if(this.enemy.currHealth <= 0){
            this.enemy.currHealth = 0;
            destroyEnemy(this);
        }else{
            this.healthText.innerText = "Health: " + this.enemy.currHealth + "/" + this.enemy.maxHealth;
        }
    }

    chooseAndShowNextAction()
    {
        //TODO: add more actions
        this.blockedDamage = 0;
        this.nextAction = this.enemy.actions[0];
        this.displayAction(this.nextAction);
    }

    getBlocked()
    {
        this.blockedDamage += 2;
        this.displayAction(this.nextAction);
    }

    displayAction(chosenAction)
    {
        if(chosenAction.damage > 0){
            let damageToInflict = chosenAction.damage - this.blockedDamage;
            if(damageToInflict < 0){
                damageToInflict = 0;
            }
            this.upcomingAttackText.innerText = "I will attack and deal " + damageToInflict + " damage!";
        }
    }
}


const playspace = document.getElementById("playspace");
const drawMat = document.getElementById("draw-mat");
const discardMat = document.getElementById("discard-mat");
const handSection = document.getElementById("hand-section");
const endTurnButton = document.getElementById("end-turn-button");
const enemySpace = document.getElementById("enemy-space");

let cardObjs = new Map(); //all instantiated cardObjs
let enemyObjs = new Map(); //
let selectedCard = null;

/*
CARDS:
    new Card("Strike", "Deal 1 damage.", new BurnCost([0]), "one_enemy", 1)
    new Card("Hammertime", "Deal 5 damage.", new BurnCost([-1, 0, 1]), "one_enemy", 5)
    new Card("Longbow", "Deal 4 damage.", new BurnCost([0, 3]), "one_enemy", 4)
*/

/*
ENEMIES:
    new Enemy("Mr. Bumbling", 10, 2);
*/

//array of cards
let deck = [
    new Card("Card 1", "*", new BurnCost([0]), "one_enemy", 1),
    new Card("Card 2", "*", new BurnCost([0]), "one_enemy", 1),
    new Card("Card 3 Yeet", "*", new BurnCost([-1, 0, 1]), "one_enemy", 1),
    new Card("Card 4", "*", new BurnCost([0]), "one_enemy", 1),
    new Card("Card 5", "*", new BurnCost([0]), "one_enemy", 1),
    new Card("Card 6", "*", new BurnCost([0]), "one_enemy", 1),
]
let discardPile = []
let enemyEncounter = [
    new Enemy("Mr. Bumbling", 10, [new EnemyAction("Attack", 2)]),
    new Enemy("Bobby the Trout", 8, [new EnemyAction("Attack", 3)]),
    new Enemy("Mr. Bumbling", 10, [new EnemyAction("Attack", 4)])
]

//array of enemy objects
let enemies = []

//array of card objects
let hand = []

//game state variables
let player = null;
let isPlayerTurn = true;
let isPlayerDefending = false;

//hover over each card while in hand
function onCardHover(e)
{
    //get selected card
    const cardEl = e.target.closest('.card');
    selectedCard = cardObjs.get(cardEl);

    if(selectedCard.canBeHovered)
    {
        console.log("HOVER");

        //set values for hover
        cardEl.style.top = `${selectedCard.handposY - 50}px`;
        cardEl.style.transform = `rotate(${0}deg)`;
        cardEl.style.transition = 'top 0.1s ease-out, left 0.1s ease-out, transform 0.1s ease-out';
        cardEl.style.zIndex = 99999;

        if(isPlayerTurn)
        {
            //if the card can be played, mark burn, otherwise don't
            if(markBurnCardsFromCard(selectedCard))
            {
                //show how the card looks when it can be played
                cardEl.style.setProperty('box-shadow', '0px 0px 20px 10px rgba(255, 255, 255, 1.0)');

                //set listeners
                selectedCard.canBePlayed = true;
                cardEl.addEventListener('mouseout', mouseOutOnCard);
            }else
            {
                //show how the card looks when it cannot be played
                cardEl.style.setProperty('box-shadow', '0px 0px 20px 10px rgba(0, 0, 0, 1.0)');

                //set listeners
                selectedCard.canBePlayed = false;
                cardEl.addEventListener('mouseout', mouseOutOnCard);
            }
        }
        else if (isPlayerDefending)
        {
            //show how the card looks when it can be used to defend
            cardEl.style.setProperty('box-shadow', '0px 0px 20px 10px rgba(255, 0, 255, 1.0)');

            //set listeners
            selectedCard.canBePlayed = true;
            cardEl.addEventListener('mouseout', mouseUpOnCard);
        }
    }
}


//when the card is in your hand, move mouse out of it to quit the hover
function mouseOutOnCard()
{
    //set style of picking up card
    if(selectedCard != null)
    {
        console.log("OUT");

        const cardEl = selectedCard.cardEl;
        cardEl.style.setProperty('z-index', selectedCard.handZPos);
        cardEl.style.setProperty('box-shadow', 'none');

        //move back to hand
        cardEl.style.left = `${selectedCard.handposX}px`;
        cardEl.style.top = `${selectedCard.handposY}px`;
        cardEl.style.transform = `rotate(${selectedCard.handRotation}deg)`;
        cardEl.style.transition = 'top 0.75s ease-in-out, left 0.75s ease-in-out, transform 0.75s ease-in-out';

        //cleanup
        SetCardHoverForUnselected(true);
        if(selectedCard != null){
            selectedCard.cardGrabbed = false;
            selectedCard.canBePlayed = false;
        }
        selectedCard = null;
        unmarkAllCardsForBurning()

        document.removeEventListener('mousemove', mouseMoveOnCard);
    }
}

//allows for clicking on selectedCard
function mouseDownOnCard(e)
{
    console.log("DOWN");

    //get selected card information
    const cardEl = e.target.closest('.card');
    if(!cardEl) return;
    selectedCard = cardObjs.get(cardEl);

    if((isPlayerTurn && selectedCard.canBePlayed) || isPlayerDefending)
    {
        //set information for start of card grab
        selectedCard.startX = e.clientX;
        selectedCard.startY = e.clientY;
        cardEl.style.setProperty('z-index', '10');
        cardEl.style.transition = 'none';
        selectedCard.cardGrabbed = true;
        
        //set event listeners
        SetCardHoverForUnselected(false);
        document.addEventListener('mousemove', mouseMoveOnCard);
        document.addEventListener('mouseup', mouseUpOnCard);
        cardEl.removeEventListener('mouseover', onCardHover);
        cardEl.removeEventListener('mouseout', mouseOutOnCard);

    }
}

//drags selectedCard
function mouseMoveOnCard(e)
{
    if(selectedCard != null)
    {
        const cardEl = selectedCard.cardEl;

        //calculate movement
        selectedCard.newX = selectedCard.startX - e.clientX;
        selectedCard.newY = selectedCard.startY - e.clientY;
        selectedCard.startX = e.clientX;
        selectedCard.startY = e.clientY;

        //set movement
        cardEl.style.top = (cardEl.offsetTop - selectedCard.newY) + 'px';
        cardEl.style.left = (cardEl.offsetLeft - selectedCard.newX) + 'px';

        if(isPlayerTurn){
            cardEl.style.setProperty('box-shadow', '0px 0px 20px 10px rgba(255, 255, 255, 1.0)');
        }else if (isPlayerDefending){
            cardEl.style.setProperty('box-shadow', '0px 0px 20px 10px rgba(255, 0, 255, 1.0)');
        }
    }
}

//lets go of selectedCard
function mouseUpOnCard(e)
{
    if(selectedCard != null)
    {
        console.log("UP");

        //cleanup burn cards
        unmarkAllCardsForBurning();

        //set style of picking up card
        const cardEl = selectedCard.cardEl;
        cardEl.style.setProperty('z-index', selectedCard.handZPos);
        cardEl.style.setProperty('box-shadow', 'none');

        //determine if card is to be played by getting what the card is hovering over
        cardEl.style.pointerEvents = 'none';
        const target = document.elementFromPoint(e.clientX, e.clientY);
        cardEl.style.pointerEvents = 'auto';

        //occurs when card hovers over enemy, this is playing the card or defending with the card
        if(selectedCard.cardGrabbed && target != null && target.className == 'enemy')
        {
            if(isPlayerTurn)
            {
                document.removeEventListener('mousemove', mouseMoveOnCard);
                const burnCardsIndices = selectedCard.card.burnCost.getIndicesToBurn(getIndexOfCardInHand(selectedCard), hand.length);
                const cardToPlay = selectedCard.card;
                removeCardsAtIndices(burnCardsIndices);
                reformatHand();
                playCard(cardToPlay, target);
            }
            else if (isPlayerDefending)
            {
                document.removeEventListener('mousemove', mouseMoveOnCard);
                removeCard(selectedCard);
                reformatHand();
                enemyObjs.get(target).getBlocked();
            }
        }
        //otherwise move the card back into the hand
        else
        {
            console.log("BACK TO HAND!");

            //move back to hand
            cardEl.style.left = `${selectedCard.handposX}px`;
            cardEl.style.top = `${selectedCard.handposY}px`;
            cardEl.style.transform = `rotate(${selectedCard.handRotation}deg)`;
            cardEl.style.transition = 'top 0.75s ease-in-out, left 0.75s ease-in-out, transform 0.75s ease-in-out';
            
            //set listeners
            document.removeEventListener('mousemove', mouseMoveOnCard);
            document.removeEventListener('mouseup', mouseUpOnCard);

            yieldForCardReturnToHand(cardEl, 750);
        }

        //cleanup
        SetCardHoverForUnselected(true);
        if(selectedCard != null){
            selectedCard.cardGrabbed = false;
            selectedCard.canBePlayed = false;
        }
        selectedCard = null;
    }
}

function yieldForCardReturnToHand(cardEl, time)
{
    cardTransitionStart(cardEl);
    setTimeout(cardTransitionEnd, time, cardEl);
}


function setCanHoverCard(cardObj, canHover)
{
    cardObj.canBeHovered = canHover;
}

//card is a card with stats, targetEl is an element of the target
function playCard(card, targetEl)
{   
    if(targetEl.className == "enemy")
    {
        //execture single target card
        if(card.target == "one_enemy")
        {
            const enemyObj = enemyObjs.get(targetEl);
            
            if(card.damage > 0){
                enemyObj.takeDamage(card.damage);
            }
        }       
    }
}

//returns whether or not card can be played
function markBurnCardsFromCard(cardObj)
{
    const index = getIndexOfCardInHand(cardObj);
    const burnIndices = cardObj.card.burnCost.getIndicesToBurn(index, hand.length);
    if(burnIndices != null)
    {
        markBurnCardsFromIndices(burnIndices);
        return true;
    }
    return false;
}

function getIndexOfCardInHand(cardObj)
{
    for(let i = 0; i < hand.length; i++)
    {
        if(hand[i] == cardObj){
            return i;
        }
    }
    return -1;
}

//set box shadow to red for each card at the indices in burnIndices
function markBurnCardsFromIndices(burnIndices)
{
    for(let i = 0; i < burnIndices.length; i++)
    {
        const cardObj = hand[burnIndices[i]];
        cardObj.cardEl.style.setProperty('box-shadow', '0px 0px 20px 10px rgba(255, 0, 0, 1.0)');
    }
}

//set all cards to have no box shadow
function unmarkAllCardsForBurning()
{
    for(let i = 0; i < hand.length; i++)
    {
        hand[i].cardEl.style.setProperty('box-shadow', 'none');
    }
}

//disable movement
function cardTransitionStart(e)
{
    console.log("START");
    e.removeEventListener('mouseup', mouseUpOnCard);
    e.removeEventListener('mouseover', onCardHover);
    e.removeEventListener('mousedown', mouseDownOnCard);
}

//enable movement
function cardTransitionEnd(e)
{
    e.addEventListener('mousedown', mouseDownOnCard);
    e.addEventListener('mouseover', onCardHover);
}

//either listen or do not listen for all cards except the selected one
function SetCardHoverForUnselected(enable)
{
    for(let i = 0; i < hand.length; i++){
        if(hand[i] != selectedCard){
            if(enable){
                hand[i].cardEl.addEventListener('mouseover', onCardHover);
            }else{
                hand[i].cardEl.removeEventListener('mouseover', onCardHover);
            }
        }
    }
}

//pop the next card from the deck if able, and place it in the deck area, then move it to hand
function drawFromDeck(numCards)
{
    let remainingCards = numCards;
    while(remainingCards > 0 && !(deck.length == 0 && discardPile.length == 0))
    {
        //shuffle discard pile into deck when deck is empty and discard pile is not
        if(deck.length == 0 && discardPile.length > 0){
            shuffleDiscardPileIntoDeck();
        }

        //create card object
        const rect = drawMat.getBoundingClientRect();
        let drawnCard = deck.pop();
        let cardObj = instantiateCard(drawnCard, rect.left, rect.top);

        //reform to the hand
        hand.unshift(cardObj);
        setTimeout(reformatHand, 500);

        remainingCards--;
    }
}

function shuffleDiscardPileIntoDeck()
{
    //TODO: implement actual shuffling
    for(const card of discardPile){
        deck.push(card);
    }

    discardPile = [];
}

//reorganize all card objects in the hand list
function reformatHand() 
{
    const handWidth = 200;  //width of a card
    const spacing = 150;     //horizontal spacing between cards
    const maxRotation = 15; //max rotation angle for fan effect
    const yOffset = 60;

    const centerX = window.innerWidth / 2;
    const baseY = window.innerHeight - 320; //position above bottom

    const mid = (hand.length - 1) / 2;

    for (let i = 0; i < hand.length; i++) {
        const cardObj = hand[i];
        const cardEl = cardObj.cardEl;

        const offset = (i - mid) * spacing;
        const x = centerX + offset - handWidth / 2;
        const y = baseY + Math.abs(i - mid) * 5 + yOffset; //optional slight downward curve

        const angle = (i - mid) * (maxRotation / hand.length);

        //set card position and rotation
        cardEl.style.position = `absolute`;
        cardEl.style.left = `${x}px`;
        cardEl.style.top = `${y}px`;
        cardEl.style.transform = `rotate(${angle}deg)`;
        cardEl.style.zIndex = hand.length-i;
        
        //save values 
        cardObj.handposX = x;
        cardObj.handposY = y;
        cardObj.handZPos = hand.length-i;
        cardObj.handRotation = angle;
    }
}

function removeCardsAtIndices(indexList)
{
    const cardList = [];
    for(let i = 0; i < indexList.length; i++)
    {
        cardList.push(hand[indexList[i]]);
    }
    for(let i = 0; i < cardList.length; i++)
    {
        removeCard(cardList[i]);
    }
    
}

//delete cardObj
function removeCard(cardObj)
{
    //remove cardObj from hand
    for(let i = hand.length; i >= 0; i--){
        if(hand[i] == cardObj){
            hand.splice(i, 1);
        }
    }

    //more cleanup
    discardPile.push(cardObj.card);
    cardObjs.delete(cardObj.cardEl);
    handSection.removeChild(cardObj.cardEl);
}

//delete enemyObj
function destroyEnemy(enemyObj)
{
    //remove cardObj from hand
    for(let i = enemies.length; i >= 0; i--){
        if(enemies[i] == enemyObj){
            enemies.splice(i, 1);
        }
    }

    //more cleanup
    enemyObjs.delete(enemyObj.enemyEl);
    enemySpace.removeChild(enemyObj.enemyEl);

    if(enemies.length <= 0){
        winBattle();
    }
}

//instantiate a card at the designated x and y position, returns cardObj
function instantiateCard(card, xPos, yPos)
{
    //wrap in CardObj
    cardObj = new CardObj(card, xPos, yPos);
    cardObjs.set(cardObj.cardEl, cardObj);
    handSection.appendChild(cardObj.cardEl);
    return cardObj;
}

function instantiateEnemy(enemy, xPos, yPos)
{
    //wrap in EnemyObj
    enemyObj = new EnemyObj(enemy, xPos, yPos);
    enemyObjs.set(enemyObj.enemyEl, enemyObj);
    enemySpace.appendChild(enemyObj.enemyEl);
    return enemyObj
}

function createEnemies()
{
    const centerPos = window.innerWidth/2;
    const offset = 300;
    const startPos = centerPos - (offset * (enemyEncounter.length-1)/2);
    for(let i = 0; i < enemyEncounter.length; i++)
    {
        let enemyObj = instantiateEnemy(enemyEncounter[i], startPos + offset * i, 100); 
        enemies.push(enemyObj);
    }
}

//randomly choose a next action for each enemy, and then show the 
function setNextEnemyActions()
{
    for(const enemyObj of enemies)
    {
        enemyObj.chooseAndShowNextAction();
    }
}


//call this function at the start of each battle, it draws 5 cards, sets player turn to true, 
//subscribes to end turn button, and instantiates all enemies
function startBattle()
{   
    //create enemies
    player = new Player("Player Name", 20);
    createEnemies();
    startPlayerTurn();
    window.addEventListener('resize', reformatHand);
}

function startPlayerTurn()
{
    console.log("DECK SIZE: " + deck.length + "  DISCARD SIZE: " + discardPile.length + " HAND SIZE: " + hand.length);

    isPlayerTurn = true;
    isPlayerDefending = false;
    drawFromDeck(5);
    endTurnButton.innerText = "End Turn";
    endTurnButton.addEventListener("mousedown", endPlayerTurn);
    setNextEnemyActions();

    console.log("DECK SIZE: " + deck.length + "  DISCARD SIZE: " + discardPile.length + " HAND SIZE: " + hand.length);
}

function endPlayerTurn()
{
    isPlayerTurn = false;
    endTurnButton.removeEventListener("mousedown", endPlayerTurn);
    startPlayerDefend();
}

//changes turn mode to defense
function startPlayerDefend()
{
    isPlayerDefending = true;
    endTurnButton.innerText = "End Defend";
    endTurnButton.addEventListener("mousedown", endPlayerDefend);
}

function endPlayerDefend()
{
    isPlayerDefending = false;
    endTurnButton.removeEventListener("mousedown", endPlayerDefend);
    enactEachEnemyAction();
}

function enactEachEnemyAction()
{
    //execute each ability
    for(let i = 0; i < enemies.length; i++)
    {   
        const enemyAction = enemies[i].nextAction;
        if(enemyAction.damage > 0){
            let inflictedDamage = enemyAction.damage - enemies[i].blockedDamage;
            if(inflictedDamage < 0){
                inflictedDamage = 0;
            }
            player.takeDamage(inflictedDamage);
        }
    }   

    startPlayerTurn();
}

function winBattle()
{
    console.log("YOU WON!");
}

function gameOver()
{
    console.log("Game over!");
}

startBattle();

