import pandas as pd
from pandas import ExcelWriter
from pandas import ExcelFile

#import the data files
excel_file = 'MCV1 Coverage.xlsx'
vacc_cov = pd.read_excel(excel_file, 'data-text')
vacc_cov = vacc_cov.sort_values(by=['Country (string)', 'Year (string)'])
vacc_cov = vacc_cov.reset_index(drop=True)

excel_file_2 = 'UN Population by Age.xlsx'
pop = pd.read_excel(excel_file_2, 'ESTIMATES', skiprows=16)

print('import complete')


#create set of country names to match UN data
listcountries = vacc_cov['Country (string)']
setcountries = set(listcountries)
for item in {'Andorra', 'Cook Islands', 'Dominica', 'Marshall Islands', 'Monaco', 'Nauru', 'Niue', 'Palau', 'Republic of North Macedonia', 'Saint Kitts and Nevis',
'San Marino', 'Tuvalu'}:
    setcountries.remove(item)

print('starting for loop')


#initialize vaccination coverage for countries over time in a dictionary
#format: {year: {country: pop vacc %, country: pop vacc %}}
vacc_cov_time = {}

for year in range(2011,2019):

    #isolate the population numbers for the year in a dictionary
    #format {country: {age: population, age: population}}
    population = {}
    for country in setcountries:
        for i in range(pop.shape[0]): #find the row with data for country and year
            if pop.iloc[i, 2] == country and pop.iloc[i, 7] == year:
                pop_index = i
        index_num = pop_index
        age = 0
        population[country] = {}
        while age <= 10:
            population[country][age] = pop.iloc[index_num][age+8]
            age += 1

    print(year, 'population done')


    #isolate the vaccination coverage by age in a dictionary
    #format {country: {age: vaccination, age: vaccination}}
    vaccination = {}
    for country in setcountries:
        for index, row in vacc_cov.iterrows(): #find first row with data for country
            if row['Country (string)'] == country and row['Year (string)'] >= year - 9:
                first_index = index
                break
        index_num = first_index
        age = 10
        vaccination[country] = {}
        while index_num in range(first_index, first_index+10): #earliest data from 1980
            if index_num < len(vacc_cov.index):
                if vacc_cov.iloc[index_num][4] == country: #data matches country
                    if vacc_cov.iloc[index_num][1] == year+1-age:
                        vaccination[country][age]=vacc_cov.iloc[index_num][6]
                        index_num += 1
                        age -= 1
                        continue
                    else:
                        if age+1 in vaccination[country]: #for when vaccination coverage skips a year
                            vaccination[country][age]=vaccination[country][age+1]
                        age -= 1
                        continue
                else:
                    break
            else:
                break

    print(year, 'vaccination done')


    #fill in the vaccination coverage for other ages
    for country in setcountries:
        vaccination[country][0] = 0 #not yet vaccinated
        for age in range(1,11):
            if age not in vaccination[country]:
                vaccination[country][age] = vaccination[country][max(vaccination[country].keys())]


    #calculate vaccination coverage in a dictionary
    #format {country: pop vacc %}
    vaccination_cov = {}
    for country in setcountries:
        pop_vacc = 0
        total_pop = 0
        for age in range(1,11):
            pop_vacc += vaccination[country][age] * population[country][age]
            total_pop += population[country][age]
        vaccination_cov[country] = pop_vacc / total_pop

    vacc_cov_time[year] = vaccination_cov #set vaccination coverage for year as value for the key year

    print(year, 'done')

#export results to excel
vacc_cov_pop = pd.DataFrame(vacc_cov_time)
vacc_cov_pop.to_excel('Population Coverages Over Time 1 to 10.xlsx')