import pandas as pd
from pandas import ExcelWriter
from pandas import ExcelFile

#import the data files
excel_file = 'smaller coverage.xlsx'
vacc_cov = pd.read_excel(excel_file, 'data-text')
vacc_cov = vacc_cov.sort_values(by=['Country (string)', 'Year (string)'])
vacc_cov = vacc_cov.reset_index(drop=True)

excel_file_2 = 'smaller un.xlsx'
pop = pd.read_excel(excel_file_2, 'ESTIMATES', skiprows=16)

print(1)


#create set of country names
listcountries = vacc_cov['Country (string)']
setcountries = set(listcountries)

print(2)


#isolate the population numbers for 2018
population = {}
for country in setcountries:
    for i in range(pop.shape[0]): #find the row with data for country and year
            if pop.iloc[i, 2] == country and pop.iloc[i, 7] == year:
                pop_index = i
        index_num = pop_index
    age = 0
    population[country] = {}
    while age <= 100:
        population[country][age] = pop.iloc[index_num][age+8]
        age += 1

print(3)


#isolate the vaccination coverage by age
vaccination = {}
for country in setcountries:
    for index, row in vacc_cov.iterrows():
        if row['Country (string)'] == country:
            first_index = index
            break
    index_num = first_index
    age = 39
    vaccination[country] = {}
    while index_num in range(first_index, first_index+39):
        if index_num < len(vacc_cov.index):
            if vacc_cov.iloc[index_num][4] == country:
                if vacc_cov.iloc[index_num][1] == 2019-age:
                    vaccination[country][age]=vacc_cov.iloc[index_num][6]
                    index_num += 1
                    age -= 1
                    continue
                else:
                    if age+1 in vaccination[country]:
                        vaccination[country][age]=vaccination[country][age+1]
                        age -= 1
                        continue
                    else:
                        age -= 1
                        continue
            else:
                break
        else:
            break

print(4)


#fill in the vaccination coverage for other ages
for country in setcountries:
    vaccination[country][0] = 0 #not yet vaccinated
    max_age = max(vaccination[country].keys())
    for age in range(max_age+1,56): #no vaccination data but vaccine available
        vaccination[country][age] = vaccination[country][max_age]
    for age in range(61,101): #immune if born before or during 1957
        vaccination[country][age] = 100
    for age in range(56,62): #vaccine introduced in 1963
        vaccination[country][age] = 0

print(5)


#calculate vaccination coverage
vaccination_cov = {}
for country in setcountries:
    pop_vacc = 0
    total_pop = 0
    for age in range(0,101):
        pop_vacc += vaccination[country][age] * population[country][age]
        total_pop += population[country][age]
    vaccination_cov[country] = pop_vacc / total_pop

print(6)


#export results to excel
vacc_cov_pop = pd.DataFrame(vaccination_cov, index = ['Population Coverage']).T
vacc_cov_pop.to_excel('Population Coverages test.xlsx')