class World{	
	constructor(maxGens, size, solution, div, stats){
		this.MutationRate = 0.0015;
		this.MaxGens = maxGens ? maxGens : 20000;
		this.GenCount = 0;
		this.GenInterval;
		this.Fitness = new Fitness(solution ? solution : "RUNNERS!");
		this.Fittest = null;
		this.Population = new Population(size ? size : null);
		this.Population.initialize();
		
		this.ParentID = div ? div : "genetics";
		this.Title;
		this.FittestDescription;
		this.Generation;
		
		this.StatsID = stats ? stats : "stats";
		this.ButtonStart;
		this.ButtonStop;
		this.PopulationList;
		this.SolutionText;
		this.WarningMessage;
		
		this.DomInit();
	}
	
	DomInit(){
		var parent = document.getElementById(this.ParentID);
		this.Title = document.createElement("h1");
		this.Title.innerHTML = this.Fitness.Solution;
		
		this.FittestDescription = document.createElement("p");
		
		this.Generation = document.createElement("p");
		
		parent.appendChild(this.Title);
		parent.appendChild(this.FittestDescription);
		parent.appendChild(this.Generation);
		
		//Stats
		var stats = document.getElementById(this.StatsID);
		this.ButtonStart = document.createElement("button");
		this.ButtonStop = document.createElement("button");
		this.PopulationList = document.createElement("ul");
		this.SolutionText = document.createElement("input");
		this.WarningMessage = document.createElement("label");
		
		this.ButtonStart.className = this.ButtonStop.className = "button";
		this.ButtonStart.innerHTML = "Run";
		this.ButtonStop.innerHTML = "Pause";
		this.ButtonStop.disabled = true;
		this.PopulationList.id = "populationList";
		this.SolutionText.className = "solutionText";
		this.SolutionText.value = this.Fitness.Solution;
		this.SolutionText.minlength = this.Fitness.Limit;
		this.SolutionText.onchange = this.UpdateSolution.bind(this);
		this.WarningMessage.className = "warning";
		
		this.ButtonStart.onclick = this.InitGen.bind(this);
		this.ButtonStop.onclick = this.StopGen.bind(this);
		
		stats.appendChild(this.ButtonStart);
		stats.appendChild(this.ButtonStop);
		stats.appendChild(this.SolutionText);
		stats.appendChild(this.WarningMessage);
		stats.appendChild(this.PopulationList);
	}
	
	UpdateDom(){
		this.FittestDescription.innerHTML = "Best Individual: " + this.Fittest.Value;
		this.Generation.innerHTML = "Generation #: " + this.GenCount;
	}
	
	UpdateSolution(){
		if(this.SolutionText.value.length == this.Fitness.Limit){
			var newSolution = this.SolutionText.value;
			this.Fitness.Solution = newSolution;
			this.Title.innerHTML = newSolution;
			this.WarningMessage.innerHTML = "";
		} else {
			this.WarningMessage.innerHTML = "Solution must be " + this.Fitness.Limit + " characters for this simulation!";
		}
	}
	
	InitGen(){
		this.GenInterval = setInterval(this.RunGen.bind(this), 1);
		this.ButtonStart.disabled = true;
		this.ButtonStop.disabled = false;
		this.SolutionText.disabled = true;
		this.PopulationList.innerHTML = "";
	}
	
	StopGen(){
		clearInterval(this.GenInterval);
		this.ButtonStart.disabled = false;
		this.ButtonStop.disabled = true;
		this.SolutionText.disabled = false;
		
		for(var i = 0; i < this.Population.Individuals.length; i++){
			var li = document.createElement("li");
			li.className = "individual";
			li.innerHTML = this.Population.Individuals[i].Value + " : " + this.Population.Individuals[i].FitnessScore;
			this.PopulationList.appendChild(li);
		}
	}
	
	RunGen(){
		if(this.GenCount >= this.MaxGens){
			this.StopGen();
			this.Fitness.SetPopulationFitness(this.Population);
			console.log("Fittest Individual: " + this.Fitness.GetMaxFitness(this.Population).FitnessScore + " : " +
				this.Fitness.GetMaxFitness(this.Population).Value);
			console.log(this.Population);
			return;
		}
		//Increment generation count
		this.GenCount++;
		
		//Set first population fitness
		this.Fitness.SetPopulationFitness(this.Population);
		
		//cache the fittest for this gen
		this.Fittest = this.Fitness.GetMaxFitness(this.Population);
		
		//Initialize the new population and keep the best of the current pop
		var newPop = new Population(this.Population.Size);
		newPop.Individuals.push(this.Fitness.GetMaxFitness(this.Population));
		
		for(var i = newPop.Individuals.length; i < this.Population.Size; i++){
			//Get the first parent
			var fitnessSum = this.Fitness.GetSumOfFitness(this.Population);
			var tourneySelect1 = this.Fitness.TournamentSelection(this.Population, fitnessSum);
			
			//parent cant mate with itself, remove it and it's score from the fitness total
			fitnessSum -= tourneySelect1.FitnessScore;
			var tempPop = new Population(this.Population.Size);
			var otherParentIndex = this.Population.Individuals.indexOf(tourneySelect1);
			
			tempPop.Individuals = this.Population.Individuals.slice(0, otherParentIndex);
			tempPop.Individuals = tempPop.Individuals.concat(this.Population.Individuals.slice(otherParentIndex + 1));
			
			//Get the second parent
			var tourneySelect2 = this.Fitness.TournamentSelection(tempPop, fitnessSum);
			
			//breed and cross the genes
			var newInd = Crossover(
				tourneySelect1,
				tourneySelect2
			)
			
			//Apply mutation to the baby
			Mutate(newInd, this.MutationRate);
			
			//cache the baby's fitness
			this.Fitness.CheckFitness(newInd);

			//add the baby to the list, and the do it all again
			newPop.Individuals.push(newInd);
		}
		
		this.Population = newPop;
		this.UpdateDom();
	}
}

//Population
class Population{
	constructor(size){
		this.Size = size ? size : 500;
		this.Individuals = [];
	}
	
	initialize(){
		for(var i = 0; i < this.Size; i++){
			this.Individuals.push(new Individual());
		}
	}
	
	FilterIndividual(value){
		return value instanceof Individual;
	}
}

//Individual
class Individual{
	constructor(chromosome){
		this.Chromosome = chromosome ? chromosome : new Chromosome();
		this.FitnessScore = 0;
		this.Value = "";
	}
}

//Chromosomes
class Chromosome{
	constructor(genes){
		this.WordLength = 8;
		this.GeneLimit = 128;
		this.Genes = genes ? genes : [];
		
		if(!genes){
			for(var i = 0; i < this.GeneLimit; i++){
				this.Genes.push(new Gene());
			}
		}
	}
}

//Gene
class Gene{
	constructor(value){
		this.Value = (typeof value != "undefined") ? value : Math.round(Math.random());
	}
}

//Allele

//Fitness
class Fitness{
	constructor(solution){
		this.Solution = solution ? solution : "test";
		this.Limit = 16;
	}
	
	SetPopulationFitness(population){
		for(var i = 0; i < population.Individuals.length; i++){
			this.CheckFitness(population.Individuals[i]);
		}
	}
	
	SortPopulation(a, b){
		if(a.FitnessScore < b.FitnessScore){
			return -1;
		}
		if(a.FitnessScore > b.FitnessScore) {
			return 1;
		}
		
		return 0;
	}
	
	//There are many ways to check fitness.
	//Checking for matching characters at an index was the easiest/simplest way to implement it.
	//Another way to is take the difference of the two characters at an index; fittest would have fitness of 0
	CheckFitness(individial){
		var string = "";
		var fitness = 1;
		for(var i = 0; i < this.Limit; i++){
			var utility = new Utility();
			var bitString = utility.ChromosomeWordToBitString(individial.Chromosome, i * individial.Chromosome.WordLength);
			string += utility.ByteToCharacter(utility.BitToByte(bitString));
		}
		
		for(var i = 0; i < string.length; i++){
			if(this.Solution[i].charCodeAt(0) === string[i].charCodeAt(0)){
				fitness++;
			}
		}
		
		individial.FitnessScore = fitness;
		individial.Value = string;
		
		return fitness;
	}
	
	GetMaxFitness(population){
		var index = 0;
		for(var i = 1; i < population.Individuals.length; i++){
			var newFitness = population.Individuals[i].FitnessScore;
			if(population.Individuals[index].FitnessScore <= newFitness){
				index = i;
			}
		}
		
		index = (index == 0 ? Math.floor(Math.random() * population.Size) : index);
		
		return population.Individuals[index];
	}
	
	GetSumOfFitness(population){
		var sum = 0;
		for(var i = 0; i < population.Individuals.length; i++){
			sum += population.Individuals[i].FitnessScore;
		}
		return sum;
	}
	
	//unused
	GetSurvivors(population){
		var newPop = new Population(population.Size);
		population.Individuals.sort(this.SortPopulation);
		newPop.Individuals = population.Individuals.slice(0, 1);
		return newPop;
	}
	
	//Not actual tournament selection.
	//Switched to roulette selection last minute.
	TournamentSelection(population, fitnessSum){
		if(fitnessSum === 0)
			return population.Individuals[GetRandomInt(0, population.Individuals.length - 1)];
	
		var index = 0;
		var randomValue = Math.random();
		
		var roulette = [];
		
		for(var i = 0; i < population.Individuals.length; i++){
			roulette.push([((population.Individuals[i].FitnessScore / fitnessSum)) + ((i !== 0) ? roulette[i-1][0] : 0), population.Individuals[i]]);
		}
		
		for(var i = 0; i < roulette.length; i++){
			if(roulette[i][0] > randomValue){
				return roulette[i][1];
			}
		}
	}
}

//Genetic Operators
function Crossover(individial1, individial2){
	var newGenes = [];
	
	for(var i = 0; i < individial1.Chromosome.GeneLimit; i++){
		if(Math.random() <= 0.5){
			newGenes.push(new Gene(individial1.Chromosome.Genes[i].Value))
		} else {
			newGenes.push(new Gene(individial2.Chromosome.Genes[i].Value))
		}
	}
	
	
	var newChromosome = new Chromosome(newGenes);
	
	var newInd = new Individual(newChromosome);
	
	return newInd;
}

function Mutate(individial, mutationRate){
	for(var i = 0; i < individial.Chromosome.Genes.length; i++){
		if(Math.random() <= mutationRate){
			individial.Chromosome.Genes[i].Value = ((individial.Chromosome.Genes[i].Value === 0) ? 1 : 0);
		}
	}
}

function GetRandomInt(min, max){
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

//Utilities
class Utility{
	BitToByte(bitString){
		return parseInt(bitString, 2);
	}
	
	ByteToCharacter(num){
		if(num < 0 || num > 255)
			return ".";
		return String.fromCharCode(num);
	}
	
	ChromosomeWordToBitString(chromosome, startIndex){
		var bit = "";
		for(var i = startIndex ? startIndex : 0; i < ((startIndex == 0) ? chromosome.WordLength : startIndex + chromosome.WordLength); i++){
			bit += chromosome.Genes[i].Value.toString();
		}
		return bit;
	}
}
