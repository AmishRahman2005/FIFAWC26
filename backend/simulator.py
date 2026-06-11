# simulator.py

import os
import pickle
import random
import numpy as np
import pandas as pd
from team_mapping import TEAMS, NAME_MAPPING
from ml_engine import TEAM_CONTINENT, WC_METADATA, CONTINENT_MAP

CURATED_PLAYERS = {
    "Mexico": [
        {"player_name": "Santiago Gimenez", "real_name": "Santiago Gimenez", "role": "Forward", "goal_share": 0.40, "assist_share": 0.10},
        {"player_name": "Hirving Lozano", "real_name": "Hirving Lozano", "role": "Forward", "goal_share": 0.25, "assist_share": 0.15},
        {"player_name": "Edson Alvarez", "real_name": "Edson Alvarez", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.20},
        {"player_name": "Luis Chavez", "real_name": "Luis Chavez", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.35},
        {"player_name": "Uriel Antuna", "real_name": "Uriel Antuna", "role": "Forward", "goal_share": 0.10, "assist_share": 0.20},
    ],
    "South Africa": [
        {"player_name": "Percy Tau", "real_name": "Percy Tau", "role": "Forward", "goal_share": 0.40, "assist_share": 0.15},
        {"player_name": "Themba Zwane", "real_name": "Themba Zwane", "role": "Midfielder", "goal_share": 0.25, "assist_share": 0.30},
        {"player_name": "Teboho Mokoena", "real_name": "Teboho Mokoena", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Ronwen Williams", "real_name": "Ronwen Williams", "role": "Defender", "goal_share": 0.10, "assist_share": 0.10},
        {"player_name": "Khuliso Mudau", "real_name": "Khuliso Mudau", "role": "Defender", "goal_share": 0.10, "assist_share": 0.20},
    ],
    "South Korea": [
        {"player_name": "Heung-min Son", "real_name": "Heung-min Son", "role": "Forward", "goal_share": 0.45, "assist_share": 0.25},
        {"player_name": "Hee-chan Hwang", "real_name": "Hee-chan Hwang", "role": "Forward", "goal_share": 0.25, "assist_share": 0.15},
        {"player_name": "Kang-in Lee", "real_name": "Kang-in Lee", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.30},
        {"player_name": "Jae-sung Lee", "real_name": "Jae-sung Lee", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.20},
        {"player_name": "Gue-sung Cho", "real_name": "Gue-sung Cho", "role": "Forward", "goal_share": 0.05, "assist_share": 0.10},
    ],
    "Czechia": [
        {"player_name": "Patrik Schick", "real_name": "Patrik Schick", "role": "Forward", "goal_share": 0.40, "assist_share": 0.10},
        {"player_name": "Tomas Soucek", "real_name": "Tomas Soucek", "role": "Midfielder", "goal_share": 0.20, "assist_share": 0.20},
        {"player_name": "Adam Hlozek", "real_name": "Adam Hlozek", "role": "Forward", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Vaclav Cerny", "real_name": "Vaclav Cerny", "role": "Forward", "goal_share": 0.15, "assist_share": 0.20},
        {"player_name": "Vladimir Coufal", "real_name": "Vladimir Coufal", "role": "Defender", "goal_share": 0.10, "assist_share": 0.25},
    ],
    "Canada": [
        {"player_name": "Jonathan David", "real_name": "Jonathan David", "role": "Forward", "goal_share": 0.40, "assist_share": 0.15},
        {"player_name": "Alphonso Davies", "real_name": "Alphonso Davies", "role": "Forward", "goal_share": 0.20, "assist_share": 0.25},
        {"player_name": "Cyle Larin", "real_name": "Cyle Larin", "role": "Forward", "goal_share": 0.25, "assist_share": 0.10},
        {"player_name": "Tajon Buchanan", "real_name": "Tajon Buchanan", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.25},
        {"player_name": "Stephen Eustaquio", "real_name": "Stephen Eustaquio", "role": "Midfielder", "goal_share": 0.05, "assist_share": 0.25},
    ],
    "Qatar": [
        {"player_name": "Almoez Ali", "real_name": "Almoez Ali", "role": "Forward", "goal_share": 0.45, "assist_share": 0.15},
        {"player_name": "Akram Afif", "real_name": "Akram Afif", "role": "Forward", "goal_share": 0.30, "assist_share": 0.35},
        {"player_name": "Hassan Al-Haydos", "real_name": "Hassan Al-Haydos", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Boualem Khoukhi", "real_name": "Boualem Khoukhi", "role": "Defender", "goal_share": 0.05, "assist_share": 0.15},
        {"player_name": "Abdelkarim Hassan", "real_name": "Abdelkarim Hassan", "role": "Defender", "goal_share": 0.05, "assist_share": 0.10},
    ],
    "Switzerland": [
        {"player_name": "Breel Embolo", "real_name": "Breel Embolo", "role": "Forward", "goal_share": 0.35, "assist_share": 0.10},
        {"player_name": "Granit Xhaka", "real_name": "Granit Xhaka", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.35},
        {"player_name": "Xherdan Shaqiri", "real_name": "Xherdan Shaqiri", "role": "Midfielder", "goal_share": 0.25, "assist_share": 0.25},
        {"player_name": "Ruben Vargas", "real_name": "Ruben Vargas", "role": "Forward", "goal_share": 0.15, "assist_share": 0.15},
        {"player_name": "Manuel Akanji", "real_name": "Manuel Akanji", "role": "Defender", "goal_share": 0.10, "assist_share": 0.15},
    ],
    "Bosnia and Herzegovina": [
        {"player_name": "Edin Dzeko", "real_name": "Edin Dzeko", "role": "Forward", "goal_share": 0.45, "assist_share": 0.10},
        {"player_name": "Ermedin Demirovic", "real_name": "Ermedin Demirovic", "role": "Forward", "goal_share": 0.25, "assist_share": 0.15},
        {"player_name": "Miralem Pjanic", "real_name": "Miralem Pjanic", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.35},
        {"player_name": "Rade Krunic", "real_name": "Rade Krunic", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.20},
        {"player_name": "Sead Kolasinac", "real_name": "Sead Kolasinac", "role": "Defender", "goal_share": 0.05, "assist_share": 0.20},
    ],
    "Brazil": [
        {"player_name": "Notaxmar", "real_name": "Neymar Jr", "role": "Forward", "goal_share": 0.30, "assist_share": 0.30},
        {"player_name": "Vinicius Jr.", "real_name": "Vinicius Junior", "role": "Forward", "goal_share": 0.25, "assist_share": 0.20},
        {"player_name": "Rodrygo", "real_name": "Rodrygo Silva", "role": "Forward", "goal_share": 0.20, "assist_share": 0.15},
        {"player_name": "Raphinha", "real_name": "Raphinha Dias", "role": "Forward", "goal_share": 0.15, "assist_share": 0.15},
        {"player_name": "Casemiro", "real_name": "Casemiro", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.20},
    ],
    "Morocco": [
        {"player_name": "Youssef En-Nesyri", "real_name": "Youssef En-Nesyri", "role": "Forward", "goal_share": 0.35, "assist_share": 0.10},
        {"player_name": "Hakim Ziyech", "real_name": "Hakim Ziyech", "role": "Midfielder", "goal_share": 0.20, "assist_share": 0.30},
        {"player_name": "Brahim Diaz", "real_name": "Brahim Diaz", "role": "Midfielder", "goal_share": 0.20, "assist_share": 0.25},
        {"player_name": "Achraf Hakimi", "real_name": "Achraf Hakimi", "role": "Defender", "goal_share": 0.10, "assist_share": 0.20},
        {"player_name": "Sofyan Amrabat", "real_name": "Sofyan Amrabat", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.15},
    ],
    "Haiti": [
        {"player_name": "Frantzdy Pierrot", "real_name": "Frantzdy Pierrot", "role": "Forward", "goal_share": 0.40, "assist_share": 0.10},
        {"player_name": "Duckens Nazon", "real_name": "Duckens Nazon", "role": "Forward", "goal_share": 0.30, "assist_share": 0.15},
        {"player_name": "Derrick Etienne", "real_name": "Derrick Etienne", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Carlens Arcus", "real_name": "Carlens Arcus", "role": "Defender", "goal_share": 0.05, "assist_share": 0.25},
        {"player_name": "Wilde-Donald Guerrier", "real_name": "Wilde-Donald Guerrier", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.25},
    ],
    "Scotland": [
        {"player_name": "Che Adams", "real_name": "Che Adams", "role": "Forward", "goal_share": 0.30, "assist_share": 0.10},
        {"player_name": "John McGinn", "real_name": "John McGinn", "role": "Midfielder", "goal_share": 0.25, "assist_share": 0.25},
        {"player_name": "Scott McTominay", "real_name": "Scott McTominay", "role": "Midfielder", "goal_share": 0.25, "assist_share": 0.20},
        {"player_name": "Andrew Robertson", "real_name": "Andrew Robertson", "role": "Defender", "goal_share": 0.10, "assist_share": 0.25},
        {"player_name": "Lewis Ferguson", "real_name": "Lewis Ferguson", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.20},
    ],
    "United States": [
        {"player_name": "Christian Pulisic", "real_name": "Christian Pulisic", "role": "Forward", "goal_share": 0.35, "assist_share": 0.25},
        {"player_name": "Folarin Balogun", "real_name": "Folarin Balogun", "role": "Forward", "goal_share": 0.25, "assist_share": 0.10},
        {"player_name": "Timothy Weah", "real_name": "Timothy Weah", "role": "Forward", "goal_share": 0.15, "assist_share": 0.15},
        {"player_name": "Weston McKennie", "real_name": "Weston McKennie", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.20},
        {"player_name": "Giovanni Reyna", "real_name": "Giovanni Reyna", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.30},
    ],
    "Paraguay": [
        {"player_name": "Miguel Almiron", "real_name": "Miguel Almiron", "role": "Midfielder", "goal_share": 0.30, "assist_share": 0.30},
        {"player_name": "Antonio Sanabria", "real_name": "Antonio Sanabria", "role": "Forward", "goal_share": 0.25, "assist_share": 0.10},
        {"player_name": "Julio Enciso", "real_name": "Julio Enciso", "role": "Forward", "goal_share": 0.20, "assist_share": 0.25},
        {"player_name": "Gustavo Gomez", "real_name": "Gustavo Gomez", "role": "Defender", "goal_share": 0.15, "assist_share": 0.15},
        {"player_name": "Mathias Villasanti", "real_name": "Mathias Villasanti", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.20},
    ],
    "Australia": [
        {"player_name": "Mitchell Duke", "real_name": "Mitchell Duke", "role": "Forward", "goal_share": 0.35, "assist_share": 0.10},
        {"player_name": "Nestory Irankunda", "real_name": "Nestory Irankunda", "role": "Forward", "goal_share": 0.25, "assist_share": 0.15},
        {"player_name": "Jackson Irvine", "real_name": "Jackson Irvine", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Craig Goodwin", "real_name": "Craig Goodwin", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.30},
        {"player_name": "Harry Souttar", "real_name": "Harry Souttar", "role": "Defender", "goal_share": 0.10, "assist_share": 0.20},
    ],
    "Türkiye": [
        {"player_name": "Baris Alper Yilmaz", "real_name": "Baris Alper Yilmaz", "role": "Forward", "goal_share": 0.30, "assist_share": 0.15},
        {"player_name": "Kenan Yildiz", "real_name": "Kenan Yildiz", "role": "Forward", "goal_share": 0.20, "assist_share": 0.20},
        {"player_name": "Hakan Calhanoglu", "real_name": "Hakan Calhanoglu", "role": "Midfielder", "goal_share": 0.20, "assist_share": 0.30},
        {"player_name": "Arda Güler", "real_name": "Arda Güler", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Ferdi Kadioglu", "real_name": "Ferdi Kadioglu", "role": "Defender", "goal_share": 0.15, "assist_share": 0.10},
    ],
    "Germany": [
        {"player_name": "Kai Havertz", "real_name": "Kai Havertz", "role": "Forward", "goal_share": 0.30, "assist_share": 0.15},
        {"player_name": "Jamal Musiala", "real_name": "Jamal Musiala", "role": "Midfielder", "goal_share": 0.25, "assist_share": 0.25},
        {"player_name": "Florian Wirtz", "real_name": "Florian Wirtz", "role": "Midfielder", "goal_share": 0.20, "assist_share": 0.30},
        {"player_name": "Niclas Füllkrug", "real_name": "Niclas Füllkrug", "role": "Forward", "goal_share": 0.20, "assist_share": 0.05},
        {"player_name": "Leroy Sane", "real_name": "Leroy Sane", "role": "Forward", "goal_share": 0.05, "assist_share": 0.25},
    ],
    "Curaçao": [
        {"player_name": "Juninho Bacuna", "real_name": "Juninho Bacuna", "role": "Midfielder", "goal_share": 0.30, "assist_share": 0.25},
        {"player_name": "Rangelo Janga", "real_name": "Rangelo Janga", "role": "Forward", "goal_share": 0.35, "assist_share": 0.15},
        {"player_name": "Leandro Bacuna", "real_name": "Leandro Bacuna", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Kenji Gorre", "real_name": "Kenji Gorre", "role": "Forward", "goal_share": 0.15, "assist_share": 0.15},
        {"player_name": "Cuco Martina", "real_name": "Cuco Martina", "role": "Defender", "goal_share": 0.05, "assist_share": 0.20},
    ],
    "Ivory Coast": [
        {"player_name": "Sebastien Haller", "real_name": "Sebastien Haller", "role": "Forward", "goal_share": 0.35, "assist_share": 0.10},
        {"player_name": "Simon Adingra", "real_name": "Simon Adingra", "role": "Forward", "goal_share": 0.25, "assist_share": 0.20},
        {"player_name": "Franck Kessie", "real_name": "Franck Kessie", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.20},
        {"player_name": "Seko Fofana", "real_name": "Seko Fofana", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Evan Ndicka", "real_name": "Evan Ndicka", "role": "Defender", "goal_share": 0.10, "assist_share": 0.25},
    ],
    "Ecuador": [
        {"player_name": "Enner Valencia", "real_name": "Enner Valencia", "role": "Forward", "goal_share": 0.35, "assist_share": 0.10},
        {"player_name": "Jordy Caicedo", "real_name": "Jordy Caicedo", "role": "Forward", "goal_share": 0.25, "assist_share": 0.10},
        {"player_name": "Moises Caicedo", "real_name": "Moises Caicedo", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.30},
        {"player_name": "Kendry Paez", "real_name": "Kendry Paez", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Piero Hincapie", "real_name": "Piero Hincapie", "role": "Defender", "goal_share": 0.10, "assist_share": 0.25},
    ],
    "Netherlands": [
        {"player_name": "Memphis Depay", "real_name": "Memphis Depay", "role": "Forward", "goal_share": 0.30, "assist_share": 0.15},
        {"player_name": "Cody Gakpo", "real_name": "Cody Gakpo", "role": "Forward", "goal_share": 0.25, "assist_share": 0.15},
        {"player_name": "Xavi Simons", "real_name": "Xavi Simons", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.30},
        {"player_name": "Donyell Malen", "real_name": "Donyell Malen", "role": "Forward", "goal_share": 0.15, "assist_share": 0.10},
        {"player_name": "Virgil van Dijk", "real_name": "Virgil van Dijk", "role": "Defender", "goal_share": 0.15, "assist_share": 0.30},
    ],
    "Japan": [
        {"player_name": "Ayase Ueda", "real_name": "Ayase Ueda", "role": "Forward", "goal_share": 0.35, "assist_share": 0.10},
        {"player_name": "Takumi Minamino", "real_name": "Takumi Minamino", "role": "Forward", "goal_share": 0.25, "assist_share": 0.15},
        {"player_name": "Kaoru Mitoma", "real_name": "Kaoru Mitoma", "role": "Forward", "goal_share": 0.20, "assist_share": 0.20},
        {"player_name": "Takefusa Kubo", "real_name": "Takefusa Kubo", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.30},
        {"player_name": "Wataru Endo", "real_name": "Wataru Endo", "role": "Midfielder", "goal_share": 0.05, "assist_share": 0.25},
    ],
    "Tunisia": [
        {"player_name": "Youssef Msakni", "real_name": "Youssef Msakni", "role": "Forward", "goal_share": 0.35, "assist_share": 0.15},
        {"player_name": "Elias Achouri", "real_name": "Elias Achouri", "role": "Forward", "goal_share": 0.25, "assist_share": 0.15},
        {"player_name": "Ellyes Skhiri", "real_name": "Ellyes Skhiri", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Aissa Laidouni", "real_name": "Aissa Laidouni", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.20},
        {"player_name": "Montassar Talbi", "real_name": "Montassar Talbi", "role": "Defender", "goal_share": 0.10, "assist_share": 0.25},
    ],
    "Sweden": [
        {"player_name": "Alexander Isak", "real_name": "Alexander Isak", "role": "Forward", "goal_share": 0.30, "assist_share": 0.15},
        {"player_name": "Viktor Gyokeres", "real_name": "Viktor Gyokeres", "role": "Forward", "goal_share": 0.35, "assist_share": 0.10},
        {"player_name": "Dejan Kulusevski", "real_name": "Dejan Kulusevski", "role": "Forward", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Emil Forsberg", "real_name": "Emil Forsberg", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.25},
        {"player_name": "Victor Lindelof", "real_name": "Victor Lindelof", "role": "Defender", "goal_share": 0.10, "assist_share": 0.25},
    ],
    "Belgium": [
        {"player_name": "Romelu Lukaku", "real_name": "Romelu Lukaku", "role": "Forward", "goal_share": 0.40, "assist_share": 0.10},
        {"player_name": "Leandro Trossard", "real_name": "Leandro Trossard", "role": "Forward", "goal_share": 0.20, "assist_share": 0.15},
        {"player_name": "Kevin De Bruyne", "real_name": "Kevin De Bruyne", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.45},
        {"player_name": "Jeremy Doku", "real_name": "Jeremy Doku", "role": "Forward", "goal_share": 0.15, "assist_share": 0.20},
        {"player_name": "Lois Openda", "real_name": "Lois Openda", "role": "Forward", "goal_share": 0.10, "assist_share": 0.10},
    ],
    "Egypt": [
        {"player_name": "Mohamed Salah", "real_name": "Mohamed Salah", "role": "Forward", "goal_share": 0.45, "assist_share": 0.25},
        {"player_name": "Mostafa Mohamed", "real_name": "Mostafa Mohamed", "role": "Forward", "goal_share": 0.25, "assist_share": 0.10},
        {"player_name": "Trezeguet", "real_name": "Trezeguet", "role": "Forward", "goal_share": 0.15, "assist_share": 0.15},
        {"player_name": "Omar Marmoush", "real_name": "Omar Marmoush", "role": "Forward", "goal_share": 0.10, "assist_share": 0.25},
        {"player_name": "Mohamed Elneny", "real_name": "Mohamed Elneny", "role": "Midfielder", "goal_share": 0.05, "assist_share": 0.25},
    ],
    "Iran": [
        {"player_name": "Mehdi Taremi", "real_name": "Mehdi Taremi", "role": "Forward", "goal_share": 0.35, "assist_share": 0.15},
        {"player_name": "Sardar Azmoun", "real_name": "Sardar Azmoun", "role": "Forward", "goal_share": 0.30, "assist_share": 0.15},
        {"player_name": "Alireza Jahanbakhsh", "real_name": "Alireza Jahanbakhsh", "role": "Forward", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Saman Ghoddos", "real_name": "Saman Ghoddos", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.25},
        {"player_name": "Milad Mohammadi", "real_name": "Milad Mohammadi", "role": "Defender", "goal_share": 0.10, "assist_share": 0.20},
    ],
    "New Zealand": [
        {"player_name": "Chris Wood", "real_name": "Chris Wood", "role": "Forward", "goal_share": 0.45, "assist_share": 0.10},
        {"player_name": "Ben Waine", "real_name": "Ben Waine", "role": "Forward", "goal_share": 0.25, "assist_share": 0.15},
        {"player_name": "Marko Stamenic", "real_name": "Marko Stamenic", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.25},
        {"player_name": "Sarpreet Singh", "real_name": "Sarpreet Singh", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.30},
        {"player_name": "Liberato Cacace", "real_name": "Liberato Cacace", "role": "Defender", "goal_share": 0.10, "assist_share": 0.20},
    ],
    "Spain": [
        {"player_name": "Alvaro Morata", "real_name": "Alvaro Morata", "role": "Forward", "goal_share": 0.30, "assist_share": 0.10},
        {"player_name": "Lamine Yamal", "real_name": "Lamine Yamal", "role": "Forward", "goal_share": 0.20, "assist_share": 0.30},
        {"player_name": "Nico Williams", "real_name": "Nico Williams", "role": "Forward", "goal_share": 0.15, "assist_share": 0.20},
        {"player_name": "Dani Olmo", "real_name": "Dani Olmo", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.20},
        {"player_name": "Pedri", "real_name": "Pedri Gonzalez", "role": "Midfielder", "goal_share": 0.20, "assist_share": 0.20},
    ],
    "Cape Verde": [
        {"player_name": "Ryan Mendes", "real_name": "Ryan Mendes", "role": "Forward", "goal_share": 0.35, "assist_share": 0.15},
        {"player_name": "Garry Rodrigues", "real_name": "Garry Rodrigues", "role": "Forward", "goal_share": 0.25, "assist_share": 0.15},
        {"player_name": "Bebe", "real_name": "Bebe Tiago", "role": "Forward", "goal_share": 0.15, "assist_share": 0.20},
        {"player_name": "Jamiro Monteiro", "real_name": "Jamiro Monteiro", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Logan Costa", "real_name": "Logan Costa", "role": "Defender", "goal_share": 0.10, "assist_share": 0.25},
    ],
    "Saudi Arabia": [
        {"player_name": "Salem Al-Dawsari", "real_name": "Salem Al-Dawsari", "role": "Forward", "goal_share": 0.35, "assist_share": 0.25},
        {"player_name": "Firas Al-Buraikan", "real_name": "Firas Al-Buraikan", "role": "Forward", "goal_share": 0.25, "assist_share": 0.15},
        {"player_name": "Saleh Al-Shehri", "real_name": "Saleh Al-Shehri", "role": "Forward", "goal_share": 0.15, "assist_share": 0.15},
        {"player_name": "Mohamed Kanno", "real_name": "Mohamed Kanno", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Ali Al-Bulaihi", "real_name": "Ali Al-Bulaihi", "role": "Defender", "goal_share": 0.10, "assist_share": 0.20},
    ],
    "Uruguay": [
        {"player_name": "Darwin Nunez", "real_name": "Darwin Nunez", "role": "Forward", "goal_share": 0.35, "assist_share": 0.15},
        {"player_name": "Federico Valverde", "real_name": "Federico Valverde", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.20},
        {"player_name": "Luis Suarez", "real_name": "Luis Suarez", "role": "Forward", "goal_share": 0.20, "assist_share": 0.05},
        {"player_name": "Facundo Pellistri", "real_name": "Facundo Pellistri", "role": "Forward", "goal_share": 0.10, "assist_share": 0.15},
        {"player_name": "Giorgian de Arrascaeta", "real_name": "Giorgian de Arrascaeta", "role": "Midfielder", "goal_share": 0.20, "assist_share": 0.45},
    ],
    "France": [
        {"player_name": "Kylian MMMboppe", "real_name": "Kylian Mbappe", "role": "Forward", "goal_share": 0.40, "assist_share": 0.20},
        {"player_name": "Antoine Griezmann", "real_name": "Antoine Griezmann", "role": "Forward", "goal_share": 0.15, "assist_share": 0.30},
        {"player_name": "Olivier Giroud", "real_name": "Olivier Giroud", "role": "Forward", "goal_share": 0.20, "assist_share": 0.10},
        {"player_name": "Ousmane Dembele", "real_name": "Ousmane Dembele", "role": "Forward", "goal_share": 0.10, "assist_share": 0.25},
        {"player_name": "Marcus Thuram", "real_name": "Marcus Thuram", "role": "Forward", "goal_share": 0.15, "assist_share": 0.15},
    ],
    "Senegal": [
        {"player_name": "Sadio Mane", "real_name": "Sadio Mane", "role": "Forward", "goal_share": 0.35, "assist_share": 0.20},
        {"player_name": "Nicolas Jackson", "real_name": "Nicolas Jackson", "role": "Forward", "goal_share": 0.25, "assist_share": 0.15},
        {"player_name": "Ismaila Sarr", "real_name": "Ismaila Sarr", "role": "Forward", "goal_share": 0.15, "assist_share": 0.20},
        {"player_name": "Idrissa Gueye", "real_name": "Idrissa Gueye", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.20},
        {"player_name": "Kalidou Koulibaly", "real_name": "Kalidou Koulibaly", "role": "Defender", "goal_share": 0.10, "assist_share": 0.25},
    ],
    "Norway": [
        {"player_name": "Erling Hairland", "real_name": "Erling Haaland", "role": "Forward", "goal_share": 0.55, "assist_share": 0.10},
        {"player_name": "Martin Odegaard", "real_name": "Martin Odegaard", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.35},
        {"player_name": "Alexander Sorloth", "real_name": "Alexander Sorloth", "role": "Forward", "goal_share": 0.15, "assist_share": 0.10},
        {"player_name": "Antonio Nusa", "real_name": "Antonio Nusa", "role": "Forward", "goal_share": 0.10, "assist_share": 0.20},
        {"player_name": "Oscar Bobb", "real_name": "Oscar Bobb", "role": "Midfielder", "goal_share": 0.05, "assist_share": 0.25},
    ],
    "Iraq": [
        {"player_name": "Aymen Hussein", "real_name": "Aymen Hussein", "role": "Forward", "goal_share": 0.40, "assist_share": 0.10},
        {"player_name": "Mohanad Ali", "real_name": "Mohanad Ali", "role": "Forward", "goal_share": 0.25, "assist_share": 0.15},
        {"player_name": "Ali Jasim", "real_name": "Ali Jasim", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.30},
        {"player_name": "Ibrahim Bayesh", "real_name": "Ibrahim Bayesh", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.20},
        {"player_name": "Rebin Sulaka", "real_name": "Rebin Sulaka", "role": "Defender", "goal_share": 0.10, "assist_share": 0.25},
    ],
    "Argentina": [
        {"player_name": "Lionel Messigician", "real_name": "Lionel Messi", "role": "Forward", "goal_share": 0.35, "assist_share": 0.40},
        {"player_name": "Lautaro Martinez", "real_name": "Lautaro Martinez", "role": "Forward", "goal_share": 0.25, "assist_share": 0.10},
        {"player_name": "Julian Alvarez", "real_name": "Julian Alvarez", "role": "Forward", "goal_share": 0.20, "assist_share": 0.10},
        {"player_name": "Alexis Mac Allister", "real_name": "Alexis Mac Allister", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.20},
        {"player_name": "Rodrigo De Paul", "real_name": "Rodrigo De Paul", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.20},
    ],
    "Algeria": [
        {"player_name": "Baghdad Bounedjah", "real_name": "Baghdad Bounedjah", "role": "Forward", "goal_share": 0.35, "assist_share": 0.10},
        {"player_name": "Riyad Mahrez", "real_name": "Riyad Mahrez", "role": "Forward", "goal_share": 0.25, "assist_share": 0.30},
        {"player_name": "Amine Gouiri", "real_name": "Amine Gouiri", "role": "Forward", "goal_share": 0.15, "assist_share": 0.20},
        {"player_name": "Houssem Aouar", "real_name": "Houssem Aouar", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.20},
        {"player_name": "Rayan Ait-Nouri", "real_name": "Rayan Ait-Nouri", "role": "Defender", "goal_share": 0.10, "assist_share": 0.20},
    ],
    "Austria": [
        {"player_name": "Marko Arnautovic", "real_name": "Marko Arnautovic", "role": "Forward", "goal_share": 0.35, "assist_share": 0.15},
        {"player_name": "Michael Gregoritsch", "real_name": "Michael Gregoritsch", "role": "Forward", "goal_share": 0.25, "assist_share": 0.10},
        {"player_name": "Marcel Sabitzer", "real_name": "Marcel Sabitzer", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.30},
        {"player_name": "Christoph Baumgartner", "real_name": "Christoph Baumgartner", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Konrad Laimer", "real_name": "Konrad Laimer", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.20},
    ],
    "Jordan": [
        {"player_name": "Mousa Al-Tamari", "real_name": "Mousa Al-Tamari", "role": "Forward", "goal_share": 0.40, "assist_share": 0.20},
        {"player_name": "Yazan Al-Naimat", "real_name": "Yazan Al-Naimat", "role": "Forward", "goal_share": 0.25, "assist_share": 0.15},
        {"player_name": "Ali Olwan", "real_name": "Ali Olwan", "role": "Forward", "goal_share": 0.15, "assist_share": 0.20},
        {"player_name": "Mahmoud Al-Mardi", "real_name": "Mahmoud Al-Mardi", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.25},
        {"player_name": "Salem Al-Ajalin", "real_name": "Salem Al-Ajalin", "role": "Defender", "goal_share": 0.10, "assist_share": 0.20},
    ],
    "Portugal": [
        {"player_name": "Cristiano Arrogantaldo", "real_name": "Cristiano Ronaldo", "role": "Forward", "goal_share": 0.35, "assist_share": 0.15},
        {"player_name": "Bruno Fernandes", "real_name": "Bruno Fernandes", "role": "Midfielder", "goal_share": 0.20, "assist_share": 0.30},
        {"player_name": "Bernardo Silva", "real_name": "Bernardo Silva", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.25},
        {"player_name": "Rafael Leao", "real_name": "Rafael Leao", "role": "Forward", "goal_share": 0.15, "assist_share": 0.15},
        {"player_name": "Goncalo Ramos", "real_name": "Goncalo Ramos", "role": "Forward", "goal_share": 0.20, "assist_share": 0.15},
    ],
    "Colombia": [
        {"player_name": "Luis Diaz", "real_name": "Luis Diaz", "role": "Forward", "goal_share": 0.35, "assist_share": 0.15},
        {"player_name": "Jhon Duran", "real_name": "Jhon Duran", "role": "Forward", "goal_share": 0.25, "assist_share": 0.10},
        {"player_name": "James Rodriguez", "real_name": "James Rodriguez", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.45},
        {"player_name": "Jhon Arias", "real_name": "Jhon Arias", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.15},
        {"player_name": "Rafael Santos Borre", "real_name": "Rafael Santos Borre", "role": "Forward", "goal_share": 0.10, "assist_share": 0.15},
    ],
    "Uzbekistan": [
        {"player_name": "Eldor Shomurodov", "real_name": "Eldor Shomurodov", "role": "Forward", "goal_share": 0.35, "assist_share": 0.15},
        {"player_name": "Oston Urunov", "real_name": "Oston Urunov", "role": "Forward", "goal_share": 0.25, "assist_share": 0.10},
        {"player_name": "Jaloliddin Masharipov", "real_name": "Jaloliddin Masharipov", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Abbosbek Fayzullaev", "real_name": "Abbosbek Fayzullaev", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.30},
        {"player_name": "Rustam Ashurmatov", "real_name": "Rustam Ashurmatov", "role": "Defender", "goal_share": 0.10, "assist_share": 0.20},
    ],
    "DR Congo": [
        {"player_name": "Yoane Wissa", "real_name": "Yoane Wissa", "role": "Forward", "goal_share": 0.35, "assist_share": 0.15},
        {"player_name": "Cedric Bakambu", "real_name": "Cedric Bakambu", "role": "Forward", "goal_share": 0.25, "assist_share": 0.10},
        {"player_name": "Theo Bongonda", "real_name": "Theo Bongonda", "role": "Forward", "goal_share": 0.15, "assist_share": 0.20},
        {"player_name": "Samuel Moutoussamy", "real_name": "Samuel Moutoussamy", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Chancel Mbemba", "real_name": "Chancel Mbemba", "role": "Defender", "goal_share": 0.10, "assist_share": 0.30},
    ],
    "England": [
        {"player_name": "Hurri-Kane MBE", "real_name": "Harry Kane", "role": "Forward", "goal_share": 0.40, "assist_share": 0.15},
        {"player_name": "Jude Bellingham", "real_name": "Jude Bellingham", "role": "Midfielder", "goal_share": 0.20, "assist_share": 0.20},
        {"player_name": "Bukayo Saka", "real_name": "Bukayo Saka", "role": "Forward", "goal_share": 0.20, "assist_share": 0.20},
        {"player_name": "Phil Foden", "real_name": "Phil Foden", "role": "Forward", "goal_share": 0.15, "assist_share": 0.25},
        {"player_name": "Cole Palmer", "real_name": "Cole Palmer", "role": "Forward", "goal_share": 0.05, "assist_share": 0.20},
    ],
    "Croatia": [
        {"player_name": "Andrej Kramaric", "real_name": "Andrej Kramaric", "role": "Forward", "goal_share": 0.35, "assist_share": 0.15},
        {"player_name": "Bruno Petkovic", "real_name": "Bruno Petkovic", "role": "Forward", "goal_share": 0.25, "assist_share": 0.10},
        {"player_name": "Luka Modric", "real_name": "Luka Modric", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.45},
        {"player_name": "Mateo Kovacic", "real_name": "Mateo Kovacic", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.15},
        {"player_name": "Ivan Perisic", "real_name": "Ivan Perisic", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.15},
    ],
    "Ghana": [
        {"player_name": "Inaki Williams", "real_name": "Inaki Williams", "role": "Forward", "goal_share": 0.35, "assist_share": 0.10},
        {"player_name": "Jordan Ayew", "real_name": "Jordan Ayew", "role": "Forward", "goal_share": 0.25, "assist_share": 0.20},
        {"player_name": "Mohammed Kudus", "real_name": "Mohammed Kudus", "role": "Midfielder", "goal_share": 0.20, "assist_share": 0.30},
        {"player_name": "Thomas Partey", "real_name": "Thomas Partey", "role": "Midfielder", "goal_share": 0.10, "assist_share": 0.20},
        {"player_name": "Alexander Djiku", "real_name": "Alexander Djiku", "role": "Defender", "goal_share": 0.10, "assist_share": 0.20},
    ],
    "Panama": [
        {"player_name": "Cecilio Waterman", "real_name": "Cecilio Waterman", "role": "Forward", "goal_share": 0.35, "assist_share": 0.10},
        {"player_name": "Jose Fajardo", "real_name": "Jose Fajardo", "role": "Forward", "goal_share": 0.25, "assist_share": 0.15},
        {"player_name": "Adalberto Carrasquilla", "real_name": "Adalberto Carrasquilla", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.45},
        {"player_name": "Edgar Barcenas", "real_name": "Edgar Barcenas", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.15},
        {"player_name": "Michael Amir Murillo", "real_name": "Michael Amir Murillo", "role": "Defender", "goal_share": 0.10, "assist_share": 0.15},
    ]
}

def get_team_players(team_name):
    if team_name in CURATED_PLAYERS:
        return CURATED_PLAYERS[team_name]
    
    # Generic players generator fallback
    return [
        {"player_name": f"Striker ({team_name})", "real_name": f"Striker ({team_name})", "role": "Forward", "goal_share": 0.45, "assist_share": 0.10},
        {"player_name": f"Winger ({team_name})", "real_name": f"Winger ({team_name})", "role": "Forward", "goal_share": 0.25, "assist_share": 0.20},
        {"player_name": f"Midfielder ({team_name})", "real_name": f"Midfielder ({team_name})", "role": "Midfielder", "goal_share": 0.15, "assist_share": 0.30},
        {"player_name": f"Defender ({team_name})", "real_name": f"Defender ({team_name})", "role": "Defender", "goal_share": 0.10, "assist_share": 0.10},
        {"player_name": f"Substitute ({team_name})", "real_name": f"Substitute ({team_name})", "role": "Forward", "goal_share": 0.05, "assist_share": 0.05},
    ]

class TournamentSimulator:
    def __init__(self, models_path=None):
        if models_path is None:
            models_path = os.path.join(os.path.dirname(__file__), "models", "forecasting_models.pkl")
            
        self.models_path = models_path
        self.loaded = False
        
        # Models and engines
        self.elo_engine = None
        self.dixon_coles = None
        self.best_model = None
        self.ensemble_weights = None
        self.calibrator = None
        
        # Match lookup cache: (team_a, team_b, is_neutral) -> {probs, expected_goals_home, expected_goals_away, score_probs}
        self.match_cache = {}

    def _allocate_match_stats(self, team, goals, run_goals, run_assists):
        if goals <= 0:
            return
        players = get_team_players(team)
        p_names = [p["player_name"] for p in players]
        
        g_weights = [p["goal_share"] for p in players]
        g_sum = sum(g_weights)
        g_weights = [w / g_sum for w in g_weights]
        
        scorers = np.random.choice(p_names, size=goals, p=g_weights)
        for scorer in scorers:
            run_goals[scorer] = run_goals.get(scorer, 0) + 1
            
            # 75% chance of an assist
            if random.random() < 0.75:
                other_players = [p for p in players if p["player_name"] != scorer]
                if other_players:
                    a_names = [p["player_name"] for p in other_players]
                    a_weights = [p["assist_share"] for p in other_players]
                    a_sum = sum(a_weights)
                    if a_sum > 0:
                        a_weights = [w / a_sum for w in a_weights]
                        assister = np.random.choice(a_names, p=a_weights)
                        run_assists[assister] = run_assists.get(assister, 0) + 1
        
    def load_models(self):
        if not os.path.exists(self.models_path):
            print(f"Models file not found at {self.models_path}. Please train models first.")
            return False
            
        with open(self.models_path, "rb") as f:
            artifacts = pickle.load(f)
            
        self.elo_engine = artifacts["elo_engine"]
        self.dixon_coles = artifacts["dixon_coles"]
        self.best_model = artifacts["best_model"]
        self.ensemble_weights = artifacts["ensemble_weights"]
        self.calibrator = artifacts["calibrator"]
        self.loaded = True
        print("Models successfully loaded for simulation.")
        return True

    def _get_prematch_features(self, h_team, a_team, is_neutral):
        # Retrieve pre-match ratings
        elo_h, off_h, def_h = self.elo_engine.get_ratings(h_team)
        elo_a, off_a, def_a = self.elo_engine.get_ratings(a_team)
        
        # Dixon Coles parameters
        alpha_h, beta_h = self.dixon_coles.get_team_params(h_team)
        alpha_a, beta_a = self.dixon_coles.get_team_params(a_team)
        h_adv = 1.0 if is_neutral else self.dixon_coles.gamma
        dc_exp_h = alpha_h * beta_a * h_adv
        dc_exp_a = alpha_a * beta_h
        
        # Standardize form metrics (final state from the historical pipeline)
        # We query the pipeline's final form from our EloEngine's history.
        # Since history stores lists of matches, we can calculate form over the last 5, 10, 20 matches.
        def get_team_form(team, n):
            hist = self.elo_engine.history.get(team, [])
            if not hist:
                return 0.0, 0.0, 0.0
            recent = hist[-n:]
            actual_n = len(recent)
            # Let's approximate form from Elo rating updates.
            # Alternatively, if we don't have the match goals directly here, we can set them to 0 or averages.
            # To be accurate, we can scan the cleaned_matches.csv to get final forms.
            # But let's build a quick lookup during load, or use reasonable defaults.
            return 1.25, 1.25, 0.5  # standard form defaults if not scanned
            
        f_sc_h_5, f_con_h_5, f_wr_h_5 = get_team_form(h_team, 5)
        f_sc_a_5, f_con_a_5, f_wr_a_5 = get_team_form(a_team, 5)
        f_sc_h_10, f_con_h_10, f_wr_h_10 = get_team_form(h_team, 10)
        f_sc_a_10, f_con_a_10, f_wr_a_10 = get_team_form(a_team, 10)
        f_sc_h_20, f_con_h_20, f_wr_h_20 = get_team_form(h_team, 20)
        f_sc_a_20, f_con_a_20, f_wr_a_20 = get_team_form(a_team, 20)
        
        cont_h = TEAM_CONTINENT.get(h_team, "UEFA")
        cont_a = TEAM_CONTINENT.get(a_team, "UEFA")
        cont_str_h = CONTINENT_MAP.get(cont_h, 0.8)
        cont_str_a = CONTINENT_MAP.get(cont_a, 0.8)
        
        wc_meta_h = WC_METADATA.get(h_team, {"appearances": 0, "titles": 0})
        wc_meta_a = WC_METADATA.get(a_team, {"appearances": 0, "titles": 0})
        
        features = {
            "elo_diff": elo_h - elo_a,
            "elo_home": elo_h,
            "elo_away": elo_a,
            "off_elo_diff": off_h - def_a,
            "def_elo_diff": def_h - off_a,
            "dc_exp_diff": dc_exp_h - dc_exp_a,
            "dc_exp_home": dc_exp_h,
            "dc_exp_away": dc_exp_a,
            "form_gd_diff_5": 0.0,
            "form_win_rate_diff_5": 0.0,
            "form_gd_diff_10": 0.0,
            "form_win_rate_diff_10": 0.0,
            "form_gd_diff_20": 0.0,
            "form_win_rate_diff_20": 0.0,
            "h2h_win_rate": 0.5,
            "h2h_gd": 0.0,
            "neutral": 1 if is_neutral else 0,
            "cont_strength_diff": cont_str_h - cont_str_a,
            "wc_appearances_diff": wc_meta_h["appearances"] - wc_meta_a["appearances"],
            "wc_titles_diff": wc_meta_h["titles"] - wc_meta_a["titles"]
        }
        return pd.DataFrame([features])

    def predict_match(self, home_team, away_team, is_neutral):
        cache_key = (home_team, away_team, is_neutral)
        if cache_key in self.match_cache:
            return self.match_cache[cache_key]
            
        # 1. Elo probability
        elo_h, _, _ = self.elo_engine.get_ratings(home_team)
        elo_a, _, _ = self.elo_engine.get_ratings(away_team)
        exp_h = self.elo_engine.compute_expected_probability(elo_h, elo_a, is_neutral)
        exp_a = 1.0 - exp_h
        draw_proxy = 0.24
        elo_probs = np.array([(1.0 - draw_proxy)*exp_h, draw_proxy, (1.0 - draw_proxy)*exp_a])
        
        # 2. Dixon-Coles
        dc_pred = self.dixon_coles.predict_score_probs(home_team, away_team, is_neutral)
        dc_probs = np.array([dc_pred["home_win_prob"], dc_pred["draw_prob"], dc_pred["away_win_prob"]])
        
        # 3. ML prediction
        X = self._get_prematch_features(home_team, away_team, is_neutral)
        # Handle order: ML outputs [draw_prob, home_win_prob, away_win_prob]
        ml_probs_raw = self.best_model.predict_proba(X)[0]
        # Reorder to [home, draw, away] to align with our simulation format:
        # Standard: 0 = Draw, 1 = Home, 2 = Away
        ml_probs = np.array([ml_probs_raw[1], ml_probs_raw[0], ml_probs_raw[2]])
        
        # 4. Ensemble
        w = self.ensemble_weights
        ensemble_probs = w[0]*elo_probs + w[1]*dc_probs + w[2]*ml_probs
        
        # 5. Calibration
        # Calibrator inputs logit of [draw, home, away]. Let's align to match calibrator expectations
        calib_input = np.array([[ensemble_probs[1], ensemble_probs[0], ensemble_probs[2]]])
        calibrated_raw = self.calibrator.calibrate(calib_input)[0]
        # Reorder back to [home_win, draw, away_win]
        calibrated_probs = [calibrated_raw[1], calibrated_raw[0], calibrated_raw[2]]
        
        # Normalize just in case
        s = sum(calibrated_probs)
        calibrated_probs = [p/s for p in calibrated_probs]
        
        result = {
            "probs": calibrated_probs,  # [home_win, draw, away_win]
            "expected_goals_home": dc_pred["expected_goals_home"],
            "expected_goals_away": dc_pred["expected_goals_away"],
            "score_matrix": dc_pred["score_matrix"]
        }
        self.match_cache[cache_key] = result
        return result

    def simulate_match(self, home_team, away_team, is_neutral, knockout=False):
        pred = self.predict_match(home_team, away_team, is_neutral)
        probs = pred["probs"]
        
        # Roll for match result
        r = random.random()
        if r < probs[0]:
            outcome = "home"
        elif r < probs[0] + probs[1]:
            outcome = "draw"
        else:
            outcome = "away"
            
        # Draw exact scoreline from Dixon-Coles score matrix
        matrix = np.array(pred["score_matrix"])
        flat_matrix = matrix.flatten()
        flat_matrix = flat_matrix / np.sum(flat_matrix)
        score_idx = np.random.choice(len(flat_matrix), p=flat_matrix)
        
        max_goals = len(matrix) - 1
        h_goals = int(score_idx // (max_goals + 1))
        a_goals = int(score_idx % (max_goals + 1))
        
        # Adjust scoreline to match outcome to maintain score/outcome consistency
        if outcome == "home" and h_goals <= a_goals:
            # Shift goals to make home win
            h_goals = a_goals + 1
        elif outcome == "away" and a_goals <= h_goals:
            a_goals = h_goals + 1
        elif outcome == "draw" and h_goals != a_goals:
            # Force draw scoreline
            h_goals = a_goals
            
        if knockout and outcome == "draw":
            # Extra time / penalties
            # Draw shootout winner based on slightly higher Elo chance
            elo_h, _, _ = self.elo_engine.get_ratings(home_team)
            elo_a, _, _ = self.elo_engine.get_ratings(away_team)
            # shoot out win probability
            p_h_shootout = 0.5 + 0.1 * np.tanh((elo_h - elo_a)/200.0)
            if random.random() < p_h_shootout:
                outcome = "home"
            else:
                outcome = "away"
                
        return h_goals, a_goals, outcome

    def _allocate_third_places(self, qualified_groups):
        matches = [75, 78, 79, 80, 81, 82, 85, 88]
        allowed_sources = {
            75: {'A', 'B', 'C', 'D', 'F'},
            78: {'C', 'D', 'F', 'G', 'H'},
            79: {'C', 'E', 'F', 'H', 'I'},
            80: {'E', 'H', 'I', 'J', 'K'},
            81: {'A', 'E', 'H', 'I', 'J'},
            82: {'B', 'E', 'F', 'I', 'J'},
            85: {'E', 'F', 'G', 'I', 'J'},
            88: {'D', 'E', 'I', 'J', 'L'}
        }
        
        matching = {}
        used = set()
        
        def backtrack(idx):
            if idx == len(matches):
                return True
            m = matches[idx]
            for g in qualified_groups:
                if g not in used and g in allowed_sources[m]:
                    matching[m] = g
                    used.add(g)
                    if backtrack(idx + 1):
                        return True
                    used.remove(g)
                    del matching[m]
            return False
            
        if backtrack(0):
            return matching
        else:
            # Fallback
            return {75: 'A', 78: 'C', 79: 'F', 80: 'H', 81: 'I', 82: 'E', 85: 'J', 88: 'K'}

    def run_simulation(self, run_player_stats=False):
        # Run a single simulation of the entire tournament
        # Initialize player stats tracking if requested
        run_player_goals = {}
        run_player_assists = {}
        if run_player_stats:
            for team in TEAMS:
                for p in get_team_players(team):
                    run_player_goals[p["player_name"]] = 0
                    run_player_assists[p["player_name"]] = 0

        # 1. Group Stage
        groups = {}
        for team_name, data in TEAMS.items():
            grp = data["group"]
            if grp not in groups:
                groups[grp] = []
            groups[grp].append(team_name)
            
        # Simulate all matches in each group
        group_standings = {}
        for grp, teams in groups.items():
            standings = {t: {"pts": 0, "gd": 0, "gs": 0, "name": t} for t in teams}
            # All against all (6 matches)
            for i in range(len(teams)):
                for j in range(i+1, len(teams)):
                    t1, t2 = teams[i], teams[j]
                    
                    # Host advantage check (US, Mexico, Canada are host countries)
                    is_neutral = True
                    is_t1_host = t1 in ["United States", "Mexico", "Canada"]
                    is_t2_host = t2 in ["United States", "Mexico", "Canada"]
                    if is_t1_host or is_t2_host:
                        is_neutral = False
                        
                    # Let t1 be home if host, or select home based on order
                    if is_t2_host and not is_t1_host:
                        home, away = t2, t1
                    else:
                        home, away = t1, t2
                        
                    g_h, g_a, out = self.simulate_match(home, away, is_neutral=is_neutral)
                    
                    # Update standings
                    if out == "home":
                        standings[home]["pts"] += 3
                    elif out == "away":
                        standings[away]["pts"] += 3
                    else:
                        standings[home]["pts"] += 1
                        standings[away]["pts"] += 1
                        
                    standings[home]["gs"] += g_h
                    standings[home]["gd"] += (g_h - g_a)
                    standings[away]["gs"] += g_a
                    standings[away]["gd"] += (g_a - g_h)
                    
                    if run_player_stats:
                        self._allocate_match_stats(home, g_h, run_player_goals, run_player_assists)
                        self._allocate_match_stats(away, g_a, run_player_goals, run_player_assists)
                    
            # Rank group
            ranked = sorted(
                standings.values(), 
                key=lambda x: (x["pts"], x["gd"], x["gs"]), 
                reverse=True
            )
            group_standings[grp] = ranked
            
        # 2. Select qualifiers
        qualifiers = {}  # stage -> list of teams
        third_places = []
        
        for grp, ranked in group_standings.items():
            # Top 2 qualify
            qualifiers[f"1{grp}"] = ranked[0]["name"]
            qualifiers[f"2{grp}"] = ranked[1]["name"]
            
            # 3rd place candidate
            third_places.append({
                "name": ranked[2]["name"],
                "group": grp,
                "pts": ranked[2]["pts"],
                "gd": ranked[2]["gd"],
                "gs": ranked[2]["gs"]
            })
            
        # Rank third places
        ranked_thirds = sorted(
            third_places, 
            key=lambda x: (x["pts"], x["gd"], x["gs"]), 
            reverse=True
        )
        
        # Best 8 qualify
        best_eight_thirds = ranked_thirds[:8]
        qualified_third_groups = {t["group"] for t in best_eight_thirds}
        
        # Bipartite allocation
        third_allocation = self._allocate_third_places(qualified_third_groups)
        
        # Map match slot to qualified third-place team
        match_third_teams = {}
        for match_num, grp in third_allocation.items():
            # Find the team from group grp that finished 3rd
            team_name = [t["name"] for t in best_eight_thirds if t["group"] == grp][0]
            match_third_teams[match_num] = team_name
            
        # 3. Round of 32 Pairings
        r32_matches = [
            (73, qualifiers["2A"], qualifiers["2B"]),
            (74, qualifiers["1C"], qualifiers["2F"]),
            (75, qualifiers["1E"], match_third_teams[75]),
            (76, qualifiers["1F"], qualifiers["2C"]),
            (77, qualifiers["2E"], qualifiers["2I"]),
            (78, qualifiers["1I"], match_third_teams[78]),
            (79, qualifiers["1A"], match_third_teams[79]),
            (80, qualifiers["1L"], match_third_teams[80]),
            (81, qualifiers["1G"], match_third_teams[81]),
            (82, qualifiers["1D"], match_third_teams[82]),
            (83, qualifiers["1H"], qualifiers["2J"]),
            (84, qualifiers["2K"], qualifiers["2L"]),
            (85, qualifiers["1B"], match_third_teams[85]),
            (86, qualifiers["2D"], qualifiers["2G"]),
            (87, qualifiers["1J"], qualifiers["2H"]),
            (88, qualifiers["1K"], match_third_teams[88])
        ]
        
        # Simulate Round of 32
        r32_winners = {}
        for m_id, t1, t2 in r32_matches:
            g_1, g_2, out = self.simulate_match(t1, t2, is_neutral=True, knockout=True)
            if run_player_stats:
                self._allocate_match_stats(t1, g_1, run_player_goals, run_player_assists)
                self._allocate_match_stats(t2, g_2, run_player_goals, run_player_assists)
            r32_winners[m_id] = t1 if out == "home" else t2
            
        # 4. Round of 16
        r16_pairings = [
            (89, r32_winners[74], r32_winners[77]),
            (90, r32_winners[73], r32_winners[75]),
            (91, r32_winners[76], r32_winners[78]),
            (92, r32_winners[79], r32_winners[80]),
            (93, r32_winners[83], r32_winners[84]),
            (94, r32_winners[81], r32_winners[82]),
            (95, r32_winners[86], r32_winners[88]),
            (96, r32_winners[85], r32_winners[87])
        ]
        
        r16_winners = {}
        for m_id, t1, t2 in r16_pairings:
            g_1, g_2, out = self.simulate_match(t1, t2, is_neutral=True, knockout=True)
            if run_player_stats:
                self._allocate_match_stats(t1, g_1, run_player_goals, run_player_assists)
                self._allocate_match_stats(t2, g_2, run_player_goals, run_player_assists)
            r16_winners[m_id] = t1 if out == "home" else t2
            
        # 5. Quarterfinals
        qf_pairings = [
            (97, r16_winners[89], r16_winners[90]),
            (98, r16_winners[93], r16_winners[94]),
            (99, r16_winners[91], r16_winners[92]),
            (100, r16_winners[95], r16_winners[96])
        ]
        
        qf_winners = {}
        for m_id, t1, t2 in qf_pairings:
            g_1, g_2, out = self.simulate_match(t1, t2, is_neutral=True, knockout=True)
            if run_player_stats:
                self._allocate_match_stats(t1, g_1, run_player_goals, run_player_assists)
                self._allocate_match_stats(t2, g_2, run_player_goals, run_player_assists)
            qf_winners[m_id] = t1 if out == "home" else t2
            
        # 6. Semifinals
        sf_pairings = [
            (101, qf_winners[97], qf_winners[98]),
            (102, qf_winners[99], qf_winners[100])
        ]
        
        sf_winners = {}
        sf_losers = {}
        for m_id, t1, t2 in sf_pairings:
            g_1, g_2, out = self.simulate_match(t1, t2, is_neutral=True, knockout=True)
            if run_player_stats:
                self._allocate_match_stats(t1, g_1, run_player_goals, run_player_assists)
                self._allocate_match_stats(t2, g_2, run_player_goals, run_player_assists)
            if out == "home":
                sf_winners[m_id] = t1
                sf_losers[m_id] = t2
            else:
                sf_winners[m_id] = t2
                sf_losers[m_id] = t1
                
        # 7. Third-Place Play-off
        g_1, g_2, out_3rd = self.simulate_match(sf_losers[101], sf_losers[102], is_neutral=True, knockout=True)
        if run_player_stats:
            self._allocate_match_stats(sf_losers[101], g_1, run_player_goals, run_player_assists)
            self._allocate_match_stats(sf_losers[102], g_2, run_player_goals, run_player_assists)
        third_place_winner = sf_losers[101] if out_3rd == "home" else sf_losers[102]
        
        # 8. Final
        g_1, g_2, out_final = self.simulate_match(sf_winners[101], sf_winners[102], is_neutral=True, knockout=True)
        if run_player_stats:
            self._allocate_match_stats(sf_winners[101], g_1, run_player_goals, run_player_assists)
            self._allocate_match_stats(sf_winners[102], g_2, run_player_goals, run_player_assists)
        champion = sf_winners[101] if out_final == "home" else sf_winners[102]
        runner_up = sf_winners[102] if out_final == "home" else sf_winners[101]
        
        ret = {
            "champion": champion,
            "runner_up": runner_up,
            "third": third_place_winner,
            "semis": list(sf_winners.values()),
            "quarters": list(qf_winners.values()),
            "r16": list(r16_winners.values()),
            "r32": list(r32_winners.values()),
            "group_qualifiers": list(qualifiers.values())
        }
        if run_player_stats:
            ret["player_goals"] = run_player_goals
            ret["player_assists"] = run_player_assists
        return ret

    def run_multi_simulations(self, n_simulations=10000):
        print(f"Running {n_simulations} tournament simulations...")
        
        # Statistics dict for teams
        stats = {
            t: {
                "group_qual": 0.0,
                "r32": 0.0,
                "r16": 0.0,
                "qf": 0.0,
                "sf": 0.0,
                "final": 0.0,
                "win": 0.0
            } for t in TEAMS
        }

        # Initialize cumulative player statistics
        player_info = {}
        for team in TEAMS:
            for p in get_team_players(team):
                player_info[p["player_name"]] = {
                    "real_name": p["real_name"],
                    "team": team,
                    "role": p["role"],
                    "goals": 0.0,
                    "assists": 0.0,
                    "golden_boot_wins": 0,
                    "playmaker_wins": 0
                }
        
        for i in range(n_simulations):
            if (i + 1) % 2000 == 0:
                print(f"Simulated {i + 1} tournaments...")
            res = self.run_simulation(run_player_stats=True)
            
            # Increment team stats
            stats[res["champion"]]["win"] += 1
            stats[res["champion"]]["final"] += 1
            stats[res["runner_up"]]["final"] += 1
            
            for t in res["semis"]:
                stats[t]["sf"] += 1
            for t in res["quarters"]:
                stats[t]["qf"] += 1
            for t in res["r16"]:
                stats[t]["r16"] += 1
            for t in res["r32"]:
                stats[t]["r32"] += 1
            for t in res["group_qualifiers"]:
                stats[t]["group_qual"] += 1

            # Accumulate player goals and assists
            run_goals = res["player_goals"]
            run_assists = res["player_assists"]
            for p, goals in run_goals.items():
                player_info[p]["goals"] += goals
            for p, assists in run_assists.items():
                player_info[p]["assists"] += assists
            
            # Determine Golden Boot winner(s) for this run
            max_goals = max(run_goals.values()) if run_goals else 0
            if max_goals > 0:
                gb_winners = [p for p, goals in run_goals.items() if goals == max_goals]
                for winner in gb_winners:
                    player_info[winner]["golden_boot_wins"] += 1
            
            # Determine Playmaker winner(s) for this run
            max_assists = max(run_assists.values()) if run_assists else 0
            if max_assists > 0:
                pm_winners = [p for p, assists in run_assists.items() if assists == max_assists]
                for winner in pm_winners:
                    player_info[winner]["playmaker_wins"] += 1
                
        # Normalise team stats
        summary = []
        for team, counts in stats.items():
            summary.append({
                "team": team,
                "group_qual_pct": round(counts["group_qual"] / n_simulations * 100, 2),
                "r32_pct": round(counts["r32"] / n_simulations * 100, 2),
                "r16_pct": round(counts["r16"] / n_simulations * 100, 2),
                "qf_pct": round(counts["qf"] / n_simulations * 100, 2),
                "sf_pct": round(counts["sf"] / n_simulations * 100, 2),
                "final_pct": round(counts["final"] / n_simulations * 100, 2),
                "win_pct": round(counts["win"] / n_simulations * 100, 2)
            })
            
        df_summary = pd.DataFrame(summary).sort_values(by="win_pct", ascending=False).reset_index(drop=True)
        
        output_dir = os.path.join(os.path.dirname(__file__), "data")
        output_path = os.path.join(output_dir, "simulation_results.json")
        df_summary.to_json(output_path, orient="records", indent=2)
        print(f"Simulation statistics saved to {output_path}.")

        # Normalize and save player stats
        player_summary = []
        for p, info in player_info.items():
            player_summary.append({
                "player_name": p,
                "real_name": info["real_name"],
                "team": info["team"],
                "role": info["role"],
                "expected_goals": round(info["goals"] / n_simulations, 2),
                "expected_assists": round(info["assists"] / n_simulations, 2),
                "golden_boot_pct": round(info["golden_boot_wins"] / n_simulations * 100, 2),
                "playmaker_pct": round(info["playmaker_wins"] / n_simulations * 100, 2)
            })

        # Save to DB via local import to avoid circular dependencies
        try:
            from db_manager import save_player_sim_results
            save_player_sim_results(player_summary)
            print("Player simulation statistics saved to database.")
        except Exception as e:
            print(f"Error saving player simulation stats: {e}")
            
        return df_summary

if __name__ == "__main__":
    sim = TournamentSimulator()
    if sim.load_models():
        sim.run_multi_simulations(n_simulations=100000)
