import csv

csv_path = r"C:\Users\amish\Downloads\FIFA World Cup 1930-2022 All Match Dataset.csv"
try:
    with open(csv_path, mode='r', encoding='latin-1') as f:
        reader = csv.reader(f)
        header = next(reader)
        print("Columns:")
        print(header)
        
        print("\nFirst 3 rows:")
        for i in range(3):
            try:
                row = next(reader)
                print(f"Row {i+1}: {row}")
            except StopIteration:
                break
except Exception as e:
    print("Error loading CSV:", e)

