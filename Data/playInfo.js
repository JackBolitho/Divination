//this is used in local storage
export class PlayerStats
{
    constructor(name, maxHealth, currHealth, deck, round)
    {
        this.name = name;
        this.maxHealth = maxHealth;
        this.currHealth = currHealth;
        this.deck = deck;
        this.round = round;
    }
}  

//contains all information for card stats
export class Card
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
export class BurnCost
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
export class CardObj
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


export function parsePlayerStats(playerStatJson)
{
    if (playerStatJson != null)
    {
        let playerStats = JSON.parse(playerStatJson);

        // rebuild deck
        playerStats.deck = playerStats.deck.map(cardJson => {
            // rebuild burn cost first
            let burnCost = null;
            if (cardJson.burnCost) {
                burnCost = new BurnCost(cardJson.burnCost.burnArray);
            }

            // rebuild the card
            return new Card(
                cardJson.name,
                cardJson.description,
                burnCost,
                cardJson.target,
                cardJson.damage
            );
        });

        return playerStats
    }
}
