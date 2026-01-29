import { Standing } from "@persistence/entities";

export class IScoringSystem {
    constructor() {
        if (this.constructor === IScoringSystem) {
            throw new Error("Cannot instantiate an abstract class.");
        }
    }

    getName() : string {
        throw new Error("Method 'Name' should be implemented.");
    }

    getDescription() : string {
        throw new Error("Method 'Description' should be implemented.");
    }

    recalc(standings: Standing[]) {
        throw new Error("Method 'recalc' should be implemented.");
    }
}

class EurocupScoreCalculator extends IScoringSystem {
    constructor() {
        super();
    }

    getName() : string {
        return "EurocupScoreCalculator";
    }

    getDescription() : string {
        return "Fail count 0";
    }

    recalc(standings: Standing[]) {
        let maxPoints = standings.length;
        let orderedStandings = standings.filter(s => !s.score.isFailed).sort((a, b) => b.score.percentage - a.score.percentage);
        let tieCount = 0;

        for (let i = 0; i < orderedStandings.length; i++) {
            orderedStandings[i].points = Math.floor(maxPoints);

            if (i + 1 < orderedStandings.length) {
                if (orderedStandings[i].score.percentage > orderedStandings[i + 1].score.percentage) {
                    if (tieCount > 0) {
                        maxPoints -= tieCount;
                        tieCount = 0;
                    }
                    maxPoints--;
                } else if (orderedStandings[i].score.percentage === orderedStandings[i + 1].score.percentage) {
                    tieCount++;
                }
            }
        }
    }
}

class FinalsCalculator extends IScoringSystem {
    constructor() {
        super();
    }

    getName() : string {
        return "EurocupFinalsScoringSystem";
    }

    getDescription() : string {
        return "First to n";
    }

    recalc(standings: Standing[]) {
        let orderedStandings = standings.sort((a, b) => b.score.percentage - a.score.percentage).sort((a, b) => b.score.isFailed ? 0 : 1);

        orderedStandings[0].points = 1;
        orderedStandings[1].points = 0;
    }
}

export class ScoringSystemProvider {
    systems: Map<string, IScoringSystem>;
    constructor() {
        this.systems = new Map<string, IScoringSystem>();
        
        this.add(new EurocupScoreCalculator())
        this.add(new FinalsCalculator())
    }
    
    add(scoreCalculator: IScoringSystem): void {
        this.systems.set(scoreCalculator.getName(), scoreCalculator);
    }

    getScoringSystem(name: string) : IScoringSystem {
        return this.systems.get(name);
    }

    getAll() : string[] {
        return Array.from(this.systems.keys());
    }
}