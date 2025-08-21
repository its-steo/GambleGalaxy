import random
import time
import string
from datetime import datetime

class EnhancedBotSimulation:
    def __init__(self):
        self.realistic_first_names = [
            'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn',
            'Blake', 'Cameron', 'Drew', 'Emery', 'Finley', 'Harper', 'Hayden',
            'Jamie', 'Kendall', 'Logan', 'Marley', 'Parker', 'Peyton', 'Reese',
            'River', 'Rowan', 'Sage', 'Skyler', 'Tatum', 'Phoenix', 'Remy',
            'Charlie', 'Dakota', 'Ellis', 'Frankie', 'Gray', 'Hunter', 'Indigo',
            'Jesse', 'Kai', 'Lane', 'Max', 'Nova', 'Ocean', 'Paige', 'Rain',
            'Sam', 'Tay', 'Val', 'Winter', 'Zion', 'Ash', 'Bay', 'Cruz',
            'Eden', 'Fox', 'Gage', 'Honor', 'Iris', 'Jude', 'Knox', 'Lux'
        ]
        
        self.realistic_last_names = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
            'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
            'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
            'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
            'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
            'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
            'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
            'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz'
        ]
        
        self.betting_personalities = {
            'conservative': {
                'bet_amounts': [500, 1000, 2000, 3000],
                'weights': [40, 35, 20, 5],
                'auto_cashout_chance': 0.85,
                'auto_cashout_range': (1.2, 2.5),
                'manual_cashout_multiplier': 2.0  # Cash out earlier
            },
            'moderate': {
                'bet_amounts': [4000, 5000, 6000, 7000, 15000],
                'weights': [25, 30, 25, 15, 5],
                'auto_cashout_chance': 0.70,
                'auto_cashout_range': (1.5, 4.0),
                'manual_cashout_multiplier': 2.0  # Normal timing
            },
            'aggressive': {
                'bet_amounts': [5000, 10000, 20000, 30000, 50000],
                'weights': [20, 25, 25, 20, 10],
                'auto_cashout_chance': 0.50,
                'auto_cashout_range': (2.0, 8.0),
                'manual_cashout_multiplier': 1.3  # Wait longer
            },
            'high_roller': {
                'bet_amounts': [20000, 50000, 100000, 150000, 200000],
                'weights': [30, 35, 20, 10, 5],
                'auto_cashout_chance': 0.60,
                'auto_cashout_range': (1.8, 6.0),
                'manual_cashout_multiplier': 1.5  # Slightly more patient
            }
        }

    def create_realistic_bot_name(self):
        """Generate realistic usernames that don't look like bots"""
        patterns = [
            # FirstnameLastname pattern
            lambda: f"{random.choice(self.realistic_first_names)}{random.choice(self.realistic_last_names)}",
            # Firstname + numbers
            lambda: f"{random.choice(self.realistic_first_names)}{random.randint(10, 99)}",
            # Firstname + year
            lambda: f"{random.choice(self.realistic_first_names)}{random.randint(1990, 2005)}",
            # FirstnameLastname + numbers
            lambda: f"{random.choice(self.realistic_first_names)}{random.choice(self.realistic_last_names)}{random.randint(1, 99)}",
            # Underscore pattern
            lambda: f"{random.choice(self.realistic_first_names).lower()}_{random.choice(self.realistic_last_names).lower()}",
            # Dot pattern
            lambda: f"{random.choice(self.realistic_first_names).lower()}.{random.choice(self.realistic_last_names).lower()}",
            # Single name + numbers
            lambda: f"{random.choice(self.realistic_first_names)}{random.randint(100, 999)}",
        ]
        
        return random.choice(patterns)()

    def assign_bot_personality(self):
        """Assign a betting personality to each bot"""
        personalities = ['conservative', 'moderate', 'aggressive', 'high_roller']
        weights = [40, 35, 20, 5]  # Most bots are conservative/moderate
        return random.choices(personalities, weights=weights, k=1)[0]

    def get_realistic_bet_amount(self, personality_type, bot_balance):
        """Get realistic bet amount based on personality and balance"""
        personality = self.betting_personalities[personality_type]
        
        # Filter bet amounts based on available balance
        available_amounts = [amt for amt in personality['bet_amounts'] if amt <= bot_balance * 0.1]
        if not available_amounts:
            available_amounts = [min(personality['bet_amounts'])]
        
        # Adjust weights for available amounts
        available_weights = personality['weights'][:len(available_amounts)]
        
        return random.choices(available_amounts, weights=available_weights, k=1)[0]

    def should_use_auto_cashout(self, personality_type):
        """Determine if bot should use auto cashout"""
        return random.random() < self.betting_personalities[personality_type]['auto_cashout_chance']

    def get_auto_cashout_multiplier(self, personality_type):
        """Get realistic auto cashout multiplier"""
        min_mult, max_mult = self.betting_personalities[personality_type]['auto_cashout_range']
        
        # Use weighted distribution for more realistic multipliers
        multipliers = [1.2, 1.5, 1.8, 2.0, 2.5, 3.0, 4.0, 5.0, 8.0, 10.0]
        weights = [20, 25, 20, 15, 10, 5, 3, 1, 0.5, 0.5]
        
        # Filter based on personality range
        valid_multipliers = [m for m in multipliers if min_mult <= m <= max_mult]
        valid_weights = [weights[multipliers.index(m)] for m in valid_multipliers]
        
        if not valid_multipliers:
            return round(random.uniform(min_mult, max_mult), 1)
        
        return random.choices(valid_multipliers, weights=valid_weights, k=1)[0]

    def calculate_human_like_cashout_probability(self, multiplier, personality_type):
        """Calculate cashout probability that mimics human behavior"""
        base_personality = self.betting_personalities[personality_type]
        modifier = base_personality['manual_cashout_multiplier']
        
        # Human-like probability curve with personality adjustments
        if multiplier < 1.3:
            base_prob = 0.01
        elif multiplier < 1.8:
            base_prob = 0.05
        elif multiplier < 2.5:
            base_prob = 0.15
        elif multiplier < 4.0:
            base_prob = 0.30
        elif multiplier < 6.0:
            base_prob = 0.45
        elif multiplier < 10.0:
            base_prob = 0.60
        else:
            base_prob = 0.75
        
        # Apply personality modifier
        adjusted_prob = base_prob / modifier if modifier > 1 else base_prob * (2 - modifier)
        
        # Add some randomness for human-like unpredictability
        randomness = random.uniform(0.8, 1.2)
        final_prob = min(0.8, max(0.01, adjusted_prob * randomness))
        
        return final_prob

    def simulate_human_delay(self):
        """Add human-like delays between actions"""
        delay_patterns = [
            lambda: random.uniform(0.1, 0.3),  # Quick decision
            lambda: random.uniform(0.5, 1.5),  # Normal thinking
            lambda: random.uniform(2.0, 4.0),  # Hesitation
            lambda: random.uniform(0.05, 0.15), # Instant reaction
        ]
        
        weights = [30, 50, 15, 5]  # Most decisions are normal speed
        delay_func = random.choices(delay_patterns, weights=weights, k=1)[0]
        
        return delay_func()

    def should_bot_participate_this_round(self):
        """Determine if bot should participate in current round"""
        # 70-85% participation rate for more realistic activity
        return random.random() < random.uniform(0.70, 0.85)

    def get_session_behavior(self):
        """Generate session-based behavior patterns"""
        session_types = {
            'short_session': {'rounds': (1, 3), 'break_chance': 0.3},
            'medium_session': {'rounds': (3, 8), 'break_chance': 0.2},
            'long_session': {'rounds': (8, 15), 'break_chance': 0.1},
            'marathon': {'rounds': (15, 30), 'break_chance': 0.05}
        }
        
        weights = [40, 35, 20, 5]
        session_type = random.choices(list(session_types.keys()), weights=weights, k=1)[0]
        
        return session_types[session_type]

# Usage example for Django management command integration
def create_enhanced_bot_system():
    """
    Integration function for Django management command
    """
    bot_sim = EnhancedBotSimulation()
    
    # Create realistic bot names
    for i in range(50):  # Create 50 diverse bots
        name = bot_sim.create_realistic_bot_name()
        personality = bot_sim.assign_bot_personality()
        print(f"Bot {i+1}: {name} - Personality: {personality}")
    
    return bot_sim

if __name__ == "__main__":
    # Test the enhanced bot system
    enhanced_bots = create_enhanced_bot_system()
