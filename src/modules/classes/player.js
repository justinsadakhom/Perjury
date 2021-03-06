import { BrownCard } from './cards/brown_card.js'
import { Health } from './health.js'
import { Roles } from './cards/role_card.js'
import { Skill, SkillNames } from './cards/skill.js'
import { Weapon, WeaponNames } from './cards/weapon.js'

class Player {

    constructor(role, character) {
        this._role = role
        this._character = character
        this._weapon = null
        this._skills = []
        this._health = this._initHealth()
        this._hand = []
        this._bullets_fired = 0;
        this._under_fire = false
    }

    _initHealth() {
        let amount = this.character.health

        if (this.role.name === Roles.PROTAGONIST)
            amount += 1

        return new Health(amount)
    }

    get role() {
        return this._role
    }

    get character() {
        return this._character
    }

    get weapon() {
        return this._weapon
    }

    setWeapon(replacement, deck) {
        if (this.weapon !== null)
            this.discardWeapon(deck)

        this._weapon = replacement
    }

    discardWeapon(deck) {
        let discard = this.weapon
        this._weapon = null
        deck.addDiscard(discard)
    }

    hasWeapon() {
        return this._weapon !== null
    }

    get skills() {
        return this._skills
    }

    addSkill(cardIndex) {
        this._skills.push(this.remove(cardIndex))
    }

    discardSkill(skillIndex, deck) {
        let discard = this.skills[skillIndex]
        this.skills.splice(skillIndex, 1)
        deck.addDiscard(discard)
    }

    hasAnySkill() {
        return this.skills.length > 0
    }

    hasSkill(skill) {
        for (let i = 0; i < this.skills.length; i++)
            if (this.skills[i].name === skill)
                return true

        return false
    }

    get health() {
        return this._health
    }

    isAlive() {
        return this.health.current > 0
    }

    damage(amount) {
        this._health.deduct(amount)
    }

    heal() {
        this._health.add(1)
    }

    get hand() {
        return this._hand
    }

    hasEmptyHand() {
        return this.hand.length === 0
    }

    canPlay(cardIndex, players) {
        return this.hand[cardIndex].isPlayable(this, players)
    }

    play(cardIndex, players, deck) {
        let card = this.hand[cardIndex]

        if (card instanceof BrownCard || card instanceof Skill)
            this.discardFromHand(cardIndex, deck)
        else if (card instanceof Weapon)
            this.discardWeapon(deck)

        card.play(this, players, cardIndex, deck)
    }

    draw(number, deck, fromDiscard=false) {

        for (let i = 0; i < number; i++) {
            if (!fromDiscard)
                this._hand.push(deck.draw())
            else
                this._hand.push(deck.draw(true))
        }
    }

    remove(cardIndex) {
        let removed = this.hand[cardIndex]
        this.hand.splice(cardIndex, 1)
        return removed
    }

    discardFromHand(cardIndex, deck) {
        deck.addDiscard(this.remove(cardIndex))
    }

    hasCard(cardType) {
        for (let i = 0; i < this._hand.length; i++)
            if (this.hand[i] instanceof cardType)
                return true

        return false
    }

    steal(cardIndex, target, fromHand=true) {
        this.hand.push(target.remove(cardIndex))
    }

    discardAllCards(deck) {
        while (!this.hasEmptyHand())
            this.discardFromHand(0, deck)

        while (!this.hasAnySkill())
            this.discardSkill(0, deck)

        this.discardWeapon(deck)
    }

    get bulletsFired() {
        return this._bullets_fired
    }

    addBullet() {
        this._bullets_fired += 1
    }

    resetBullets() {
        this._bullets_fired = 0
    }

    canFire() {
        return this.bulletsFired === 0 || (this.hasWeapon() && this.weapon.name === WeaponNames.PEACEMAKER)
    }

    get underFire() {
        return this._under_fire
    }

    set underFire(state) {
        this._under_fire = state
    }

    playerDistance(otherPlayer, players) {
        let playerIndex, otherIndex;

        for (let i = 0; i < players.length; i++) {

            if (players[i] === this)
                playerIndex = i
            if (players[i] === otherPlayer)
                otherIndex = i
        }

        let j = playerIndex
        let distance1 = 0

        while (players[j] !== otherPlayer) {
            j += 1
            distance1 += 1

            if (j === players.length)
                j = 0
        }

        let k = playerIndex
        let distance2 = 0

        while (players[k] !== otherPlayer) {
            k -= 1
            distance2 += 1

            if (k === -1)
                k = players.length - 1
        }

        if (otherPlayer.hasSkill(SkillNames.TRUST)) {
            distance1 += 1
            distance2 += 1
        }

        return Math.min(distance1, distance2)
    }

    range(withWeapon) {
        let range = 1

        if (withWeapon) {
            if (this.hasWeapon())
                range = this.weapon().range
            else
                range = 1
        }

        if (this.hasSkill(SkillNames.CONCENTRATION))
            range += 1

        return range
    }

    playersInRange(players, withWeapon = true) {
        let result = []

        for (let i = 0; i < players.length; i++)
            if (this !== players[i] && this.playerDistance(players[i], players) <= this.range(withWeapon))
                result.push(players[i])

        return result
    }
}

export { Player }