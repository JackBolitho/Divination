//this is used in local storage
export class PlayerStats
{
    constructor(name, maxHealth, currHealth, deck)
    {
        this.name = name;
        this.maxHealth = maxHealth;
        this.currHealth = currHealth;
        this.deck = deck;
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