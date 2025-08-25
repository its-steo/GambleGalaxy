import random
import time
import string
from datetime import datetime

class EnhancedBotSimulation:
    def __init__(self):
        # Diverse first names from various countries
        self.realistic_first_names = {
            'english': ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'Michael', 'Isabella'],
            'spanish': ['Juan', 'Maria', 'Carlos', 'Sofia', 'Luis', 'Ana', 'Jose', 'Carmen', 'Miguel', 'Laura'],
            'african': ['Aisha', 'Musa', 'Fatima', 'Ibrahim', 'Chidi', 'Ngozi', 'Kwame', 'Aminata', 'Tunde', 'Zainab'],
            'asian': ['Wei', 'Mei', 'Hiroshi', 'Sakura', 'Rahul', 'Priya', 'Min-Joon', 'Ji-Won', 'Anika', 'Chen'],
            'middle_eastern': ['Mohammed', 'Fatima', 'Ali', 'Amina', 'Omar', 'Laila', 'Hassan', 'Zahra', 'Yousef', 'Noor'],
            'european': ['Lukas', 'Anna', 'Matteo', 'Clara', 'Hugo', 'Elise', 'Frederik', 'Sophie', 'Niklas', 'Marie']
        }

        # Diverse last names from various countries
        self.realistic_last_names = {
            'english': ['Smith', 'Johnson', 'Brown', 'Taylor', 'Wilson', 'Davis', 'Clark', 'Harris', 'Lewis', 'Walker'],
            'spanish': ['Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres'],
            'african': ['Okeke', 'Mwangi', 'Oluwaseun', 'Diallo', 'Kamau', 'Adebayo', 'Ndiaye', 'Osei', 'Kone', 'Abdi'],
            'asian': ['Li', 'Wang', 'Chen', 'Singh', 'Kumar', 'Patel', 'Kim', 'Park', 'Tanaka', 'Yamamoto'],
            'middle_eastern': ['Al-Farsi', 'Haddad', 'Khalil', 'Najjar', 'Rahimi', 'Saleh', 'Hosseini', 'Yassin', 'Malik', 'Aziz'],
            'european': ['Muller', 'Schmidt', 'Rossi', 'Moreau', 'Jansen', 'Vogel', 'Andersen', 'Lefevre', 'Kowalski', 'Novak']
        }

        # Define regions and their weights for diversity
        self.regions = ['english', 'spanish', 'african', 'asian', 'middle_eastern', 'european']
        self.region_weights = [30, 20, 15, 15, 10, 10]  # Adjust based on desired distribution

        self.betting_personalities = {
            'conservative': {
                'bet_amounts': [500, 1000, 2000, 3000],
                'weights': [40, 35, 20, 5],
                'auto_cashout_chance': 0.85,
                'auto_cashout_range': (1.2, 2.5),
                'manual_cashout_multiplier': 2.0
            },
            'moderate': {
                'bet_amounts': [4000, 5000, 6000, 7000, 15000],
                'weights': [25, 30, 25, 15, 5],
                'auto_cashout_chance': 0.70,
                'auto_cashout_range': (1.5, 4.0),
                'manual_cashout_multiplier': 2.0
            },
            'aggressive': {
                'bet_amounts': [5000, 10000, 20000, 30000, 50000],
                'weights': [20, 25, 25, 20, 10],
                'auto_cashout_chance': 0.50,
                'auto_cashout_range': (2.0, 8.0),
                'manual_cashout_multiplier': 1.3
            },
            'high_roller': {
                'bet_amounts': [20000, 50000, 100000, 150000, 200000],
                'weights': [30, 35, 20, 10, 5],
                'auto_cashout_chance': 0.60,
                'auto_cashout_range': (1.8, 6.0),
                'manual_cashout_multiplier': 1.5
            }
        }

    def create_realistic_bot_name(self):
        """Generate realistic usernames based on country-specific naming conventions"""
        # Choose a region for the name
        region = random.choices(self.regions, weights=self.region_weights, k=1)[0]
        first_names = self.realistic_first_names[region]
        last_names = self.realistic_last_names[region]

        # Define region-specific name patterns
        patterns = [
            # FirstnameLastname (e.g., JamesSmith)
            lambda: f"{random.choice(first_names)}{random.choice(last_names)}",
            # Firstname + Numbers (e.g., Maria23)
            lambda: f"{random.choice(first_names)}{random.randint(10, 99)}",
            # Firstname + Year (e.g., Wei1995)
            lambda: f"{random.choice(first_names)}{random.randint(1990, 2005)}",
            # FirstnameLastname + Numbers (e.g., CarlosRodriguez88)
            lambda: f"{random.choice(first_names)}{random.choice(last_names)}{random.randint(1, 99)}",
            # Firstname_Lastname (e.g., Aisha_Okeke)
            lambda: f"{random.choice(first_names).lower()}_{random.choice(last_names).lower()}",
            # Firstname.Lastname (e.g., Mohammed.Aziz)
            lambda: f"{random.choice(first_names).lower()}.{random.choice(last_names).lower()}",
            # Firstname + Initial + Lastname (e.g., AnnaCSchmidt)
            lambda: f"{random.choice(first_names)}{random.choice(string.ascii_uppercase)}{random.choice(last_names)}",
            # LastnameFirstname (common in some Asian cultures, e.g., LiWei)
            lambda: f"{random.choice(last_names)}{random.choice(first_names)}" if region == 'asian' else f"{random.choice(first_names)}{random.choice(last_names)}",
        ]

        # Weight patterns to favor common ones
        pattern_weights = [30, 20, 15, 15, 10, 5, 3, 2]
        chosen_pattern = random.choices(patterns, weights=pattern_weights, k=1)[0]
        return chosen_pattern()

    def assign_bot_personality(self):
        """Assign a betting personality to each bot"""
        personalities = ['conservative', 'moderate', 'aggressive', 'high_roller']
        weights = [40, 35, 20, 5]
        return random.choices(personalities, weights=weights, k=1)[0]

    def get_realistic_bet_amount(self, personality_type, bot_balance):
        """Get realistic bet amount based on personality and balance"""
        personality = self.betting_personalities[personality_type]
        available_amounts = [amt for amt in personality['bet_amounts'] if amt <= bot_balance * 0.1]
        if not available_amounts:
            available_amounts = [min(personality['bet_amounts'])]
        available_weights = personality['weights'][:len(available_amounts)]
        return random.choices(available_amounts, weights=available_weights, k=1)[0]

    def should_use_auto_cashout(self, personality_type):
        """Determine if bot should use auto cashout"""
        return random.random() < self.betting_personalities[personality_type]['auto_cashout_chance']

    def get_auto_cashout_multiplier(self, personality_type):
        """Get realistic auto cashout multiplier"""
        min_mult, max_mult = self.betting_personalities[personality_type]['auto_cashout_range']
        multipliers = [1.2, 1.5, 1.8, 2.0, 2.5, 3.0, 4.0, 5.0, 8.0, 10.0]
        weights = [20, 25, 20, 15, 10, 5, 3, 1, 0.5, 0.5]
        valid_multipliers = [m for m in multipliers if min_mult <= m <= max_mult]
        valid_weights = [weights[multipliers.index(m)] for m in valid_multipliers]
        if not valid_multipliers:
            return round(random.uniform(min_mult, max_mult), 1)
        return random.choices(valid_multipliers, weights=valid_weights, k=1)[0]

    def calculate_human_like_cashout_probability(self, multiplier, personality_type):
        """Calculate cashout probability that mimics human behavior"""
        base_personality = self.betting_personalities[personality_type]
        modifier = base_personality['manual_cashout_multiplier']
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
        adjusted_prob = base_prob / modifier if modifier > 1 else base_prob * (2 - modifier)
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
        weights = [30, 50, 15, 5]
        delay_func = random.choices(delay_patterns, weights=weights, k=1)[0]
        return delay_func()

    def should_bot_participate_this_round(self):
        """Determine if bot should participate in current round"""
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

def create_enhanced_bot_system():
    """Integration function for Django management command"""
    bot_sim = EnhancedBotSimulation()
    for i in range(50):
        name = bot_sim.create_realistic_bot_name()
        personality = bot_sim.assign_bot_personality()
        print(f"Bot {i+1}: {name} - Personality: {personality}")
    return bot_sim

if __name__ == "__main__":
    enhanced_bots = create_enhanced_bot_system()