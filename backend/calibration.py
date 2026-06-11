# calibration.py

import numpy as np
from sklearn.linear_model import LogisticRegression

class BayesianCalibrator:
    def __init__(self):
        self.calibrator = LogisticRegression(max_iter=1000)
        self.fitted = False
        
    def _to_logits(self, probs):
        # Convert probabilities to log-odds (logits) to use as features
        # Add epsilon to prevent log(0)
        eps = 1e-6
        probs = np.clip(probs, eps, 1.0 - eps)
        # Logits: log(p / (1-p)) for each class
        return np.log(probs / (1.0 - probs))

    def fit(self, ensemble_probs, actual_outcomes):
        """
        ensemble_probs: np.array of shape (n_samples, 3) - probabilities for [draw, home_win, away_win]
        actual_outcomes: np.array of shape (n_samples,) - [0, 1, 2] corresponding to draw, home_win, away_win
        """
        print("Calibrating probabilities using Platt Scaling (Logistic Calibration)...")
        logits = self._to_logits(ensemble_probs)
        self.calibrator.fit(logits, actual_outcomes)
        self.fitted = True
        print("Calibration fit complete.")

    def calibrate(self, ensemble_probs):
        """
        ensemble_probs: np.array of shape (n_samples, 3) or list of length 3
        """
        if not self.fitted:
            # Fallback if not fitted: return input probabilities as-is
            return ensemble_probs
            
        single = False
        if isinstance(ensemble_probs, list) or len(np.shape(ensemble_probs)) == 1:
            ensemble_probs = np.array([ensemble_probs])
            single = True
            
        logits = self._to_logits(ensemble_probs)
        calibrated_probs = self.calibrator.predict_proba(logits)
        
        if single:
            return calibrated_probs[0].tolist()
        return calibrated_probs
