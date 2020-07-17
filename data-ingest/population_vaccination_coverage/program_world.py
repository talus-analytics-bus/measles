import pandas as pd
from pandas import ExcelWriter
from pandas import ExcelFile

#import the data files
excel_file = 'Population Coverages 2011-2018.xlsx'
pop_cov = pd.read_excel(excel_file, 'Sheet1')
pop_vacc_cov = {}
for i in range(pop_cov.shape[0]):
    pop_vacc_cov[pop_cov.iloc[i, 0]] = pop_cov.iloc[i, 1:9].values.tolist()

excel_file_2 = 'UN Population by Age.xlsx'
pop = pd.read_excel(excel_file_2, 'ESTIMATES', skiprows=16)

print('import complete')


#create set of country names to match UN data
listcountries = pop_cov['Country']
setcountries = set(listcountries)

print('starting for loop')


#initialize vaccination coverage for world over time in a dictionary
#format: {year: pop vacc in world}
pop_cov_time = {}

for year in range(2011,2019):

    #isolate the population numbers for the year in a dictionary
    #format {country: total population}
    population = {}
    for country in setcountries:
        for i in range(pop.shape[0]): #find the row with data for country and year
            if pop.iloc[i, 2] == country and pop.iloc[i, 7] == year:
                pop_index = i
        index_num = pop_index
        age = 0
        population[country] = 0
        while age <= 100:
            population[country] += pop.iloc[index_num][age+8]
            age += 1

    print(year, 'population done')


    #calculate vaccination coverage population
    total_pop = 0
    total_vacc = 0
    for country in setcountries:
        total_pop += population[country]
        year_index = year%10 - 1
        total_vacc += pop_vacc_cov[country][year_index] * population[country]

    pop_cov_time[year] = total_vacc/total_pop

    print(year, 'done')

print(pop_cov_time)