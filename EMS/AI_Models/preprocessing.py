import numpy as np


def preprocess_attrition(X):
    return X.copy()


def preprocess_growth(X):
    X = X.copy()
    X["decade"]           = (X["Year"] // 10) * 10
    X["year_offset"]      = X["Year"] - 2015
    X["growth_indicator"] = X["NewWorkers"] / (X["Employees"] + 1)
    return X


def preprocess_leave(X):
    X = X.copy()
    X["leave_utilization"]  = X["LeaveTakenSoFar"] / (X["TotalLeaveEntitlement"] + 1)
    X["remaining_fraction"] = X["RemainingLeaves"]  / (X["TotalLeaveEntitlement"] + 1)
    return X


def preprocess_recruitment(X):
    X = X.copy()
    X["career_start_age"] = X["Age"] - X["ExperienceInCurrentDomain"]
    X["exp_per_year"]     = X["ExperienceInCurrentDomain"] / ((2026 - X["JoiningYear"]) + 1)
    return X


def preprocess_payroll(X):
    return X.copy()


def preprocess_fraud(X):
    X = X.copy()
    X["hours_per_project"]   = X["average_montly_hours"] / (X["number_of_projects"] + 1)
    X["tenure_no_promotion"] = X["time_spent_company"] * (1 - X["Promotion"])
    return X


def preprocess_performance(X):
    X = X.copy()
    X["projects_per_year"]    = X["Projects_Handled"] / (X["Years_At_Company"] + 1)
    X["training_per_project"] = X["Training_Hours"]   / (X["Projects_Handled"] + 1)
    return X
