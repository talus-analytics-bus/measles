import pandas as pd
import numpy as np

from measles_twitter import find_cases as twitter_cases
from measles_twitter import twitter_username
from measles_facebook import find_cases as facebook_cases


#merge the results from scraping both twitter and facebook accounts for the country's accounts
def find_cases(country):
    twitter_scrape = twitter_cases(country)
    facebook_scrape = facebook_cases(country)
    if type(twitter_scrape) == tuple:
        twitter = twitter_scrape[1]
        twitter_cumul = twitter_scrape[0]
    else:
        twitter = twitter_scrape
    if type(facebook_scrape) == tuple:
        facebook = facebook_scrape[1]
        facebook_cumul = facebook_scrape[0]
    else:
        facebook = facebook_scrape

    cases = []

    if isinstance(twitter, pd.DataFrame):
        if isinstance(facebook, pd.DataFrame):
            #merge the two results, go through the months and make sure the cumulative monthly is equal
            #if not, take the largest cumulative value for each month and output 'discrepancy, manually check'
            source = 'merged twitter and facebook data'

            merged = twitter_cumul.iloc[:,1:].merge(facebook_cumul.iloc[:,1:], left_on=('month','year'), right_on =('month','year'), suffixes=('_twitter','_facebook'), how='outer')
            match = True
            
            max_cumul = []
            for i in range(merged.shape[0]):
                row = merged.iloc[i,:]
                if row[2] != row[3]:
                    match = False
                max_cumul.append(
                    {
                        'month': row[0],
                        'year': row[1],
                        'cumulative': np.nanmax([row[2], row[3]]),
                    }
                )
            max_cumul_df = pd.DataFrame(max_cumul)
            max_cumul_df = max_cumul_df.sort_values(by=['year','month'], ascending = False)
            max_cumul_df = max_cumul_df.reset_index(drop=True)
            
            for i in range(max_cumul_df.shape[0]-1):
                row = max_cumul_df.iloc[i,:]
                cases.append(
                    {
                        'month': row[0],
                        'year': row[1],
                        country: row[2]-max_cumul_df.iloc[i+1,2]              
                    }
                )
            cases.append(
                {
                        'month': max_cumul_df.iloc[-1,0],
                        'year': max_cumul_df.iloc[-1,1],
                        country: max_cumul_df.iloc[-1,2]              
                    }
                )

            if not match:
                source += ', discrepancy - manually check'

        else:
            #take the twitter data because there is no facebook data
            source = facebook + ', using twitter data'
            for i in range(twitter.shape[0]):
                twitter_case = twitter.iloc[i,:]
                cases.append(
                    {
                        'month': twitter_case[0],
                        'year': twitter_case[1],
                        country: twitter_case[2],
                    }
                )

    else:
        if isinstance(facebook, pd.DataFrame):
            #take the facebook data because there is no twitter data
            source = twitter + ', using facebook data'
            for i in range(facebook.shape[0]):
                facebook_case = facebook.iloc[i,:]
                cases.append(
                    {
                        'month': facebook_case[0],
                        'year': facebook_case[1],
                        country: facebook_case[2],
                    }
                )

        else:
            #there is no data anywhere, report there is no caseload data
            source = twitter + ', ' + facebook + ': no caseload data'
            cases = []

    #print(source)
    cases_df = pd.DataFrame(cases)
    cases_df = cases_df.append({'month': 'origin', 'year': 'origin:', country: source}, ignore_index = True)
    #print(cases_df)

    #cases_df.to_csv('{}_caseload.csv'.format(country))
    
    return cases_df


#find results for all countries and output in caseload.csv
caseload_world = pd.read_csv(r'caseload_world.csv')
for country in twitter_username:
    print(country)
    country_cases = find_cases(country)
    caseload_world = caseload_world.merge(country_cases, left_on=('month','year'), right_on =('month','year'), how='outer')
    caseload_world.to_csv('caseload_world.csv')