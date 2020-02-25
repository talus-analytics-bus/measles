import twint
from tqdm import tqdm

import csv
import re
import os
import math

import pandas as pd
from pandas import ExcelFile


#create a dictionary twitter_username that maps country name to twitter username
excel_file = 'Ministry of Health Info copy.xlsx'
twitter_accounts = pd.read_excel(excel_file, sheet_name='Sheet3', header = 0, usecols=[0,2]).fillna(value = 0)
twitter_username = {}
for i in range(twitter_accounts.shape[0] -2):
    url = twitter_accounts.iloc[i, 1]
    country = twitter_accounts.iloc[i, 0]
    if url==0:
        twitter_username[country] = None
    else:
        match = 'twitter.com\/(.*?)\/{0,1}$'
        twitter_username[country] = re.search(match, url).group(1)

def find_cases(country):
    username = twitter_username[country]
    if username is None:
        return 'No Twitter Account'

    #download all tweets with the phrase 'measles' to a csv file named country_tweets.csv
    def get_tweets(username):
        c = twint.Config()
        c.Search = 'measles'
        c.Username = username
        c.Pandas = True
        c.Store_object = True
        c.Hide_output = True

        twint.run.Search(c)

        if not twint.output.panda.Tweets_df.empty:
            def twint_to_pandas(columns):
                return twint.output.panda.Tweets_df[columns]
            df_pd = twint_to_pandas(['date','tweet'])
            #df_pd.to_csv('{}_tweets.csv'.format(country))
            return df_pd
        else:
            return 'No Tweets about Measles'

    tweets = get_tweets(username)
    if not isinstance(tweets, pd.DataFrame):
        return tweets

    print('tweets found')


    #detect the caseload value in the tweet for each tweet, output a csv file with year/month/day of tweet and caseload reported
    def get_reported(tweets):
        reported = []
        for i in range(tweets.shape[0]):
            date = tweets.iloc[i, 0]
            tweet = tweets.iloc[i, 1]
            
            match_1 = '([0-9]+) (?:cases|measles cases|confirmed cases)'
            match_2 = '([0-9]+\,[0-9]+) (?:cases|measles cases|cases of measles)'

            if re.search(match_2, tweet):
                reported_val = re.search(match_2, tweet).group(1)
            elif re.search(match_1, tweet):
                reported_val = re.search(match_1, tweet).group(1)
            else:
                reported_val = None
                reported_num = None

            if reported_val:
                nums = [int(i) for i in reported_val if i.isdigit()] 
                func = lambda nums: int(''.join(str(i) for i in nums))
                reported_num = func(nums)
            
            if reported_num:
                reported.append(
                    {
                        'year': date[0:4],
                        'month': date[5:7],
                        'day': date[8:10],
                        'reported': reported_num
                    }
                )
        
        if reported == []:
            return 'No Twitter Caseload Data'
        else:
            reported_df = pd.DataFrame(reported)
            #reported_df.to_csv('{}_reported_twitter.csv'.format(country), index=False)
            return reported

    reported = get_reported(tweets)
    if type(reported) is not list:
        return reported

    print('twitter reported values found')


    def get_caseload(reported):
        if reported:
            report_monthly = [
                    {
                        'monthname': f"{reported[0]['month']} {reported[0]['year']}",
                        'month': int(reported[0]['month']),
                        'year': int(reported[0]['year']),
                        'cumulative_total': 0
                    }
                            ]
            a = 0
            
            for tweet in reported:
                monthname = f"{tweet['month']} {tweet['year']}"
                
                if report_monthly[a]['monthname'] == monthname:
                    if type(tweet['reported']) == int:
                        report_monthly[a]['cumulative_total'] = max(report_monthly[a]['cumulative_total'], tweet['reported'])
                    else:
                        report_monthly[a]['cumulative_total'] = report_monthly[a]['cumulative_total']
                else:
                    a += 1
                    report_monthly.append({})
                    report_monthly[a]['monthname'] = monthname
                    report_monthly[a]['month'] = int(tweet['month'])
                    report_monthly[a]['year'] = int(tweet['year'])
                    if type(tweet['reported']) == int:
                        report_monthly[a]['cumulative_total'] = tweet['reported']
                    else:
                        report_monthly[a]['cumulative_total'] = 0
            
            caseload_month = []
            for i in range(len(report_monthly)-1):
                caseload_month.append(
                    {
                        'month': report_monthly[i]['month'],
                        'year': report_monthly[i]['year'],
                        'caseload': report_monthly[i]['cumulative_total']-report_monthly[i+1]['cumulative_total'],              
                    }
                )
            caseload_month.append(
                {
                        'month': report_monthly[-1]['month'],
                        'year': report_monthly[-1]['year'],
                        'caseload': report_monthly[-1]['cumulative_total']              
                    }
                )
            
            report_monthly_df = pd.DataFrame(report_monthly)
            monthly_df = pd.DataFrame(caseload_month)
            #monthly_df.to_csv('{}_caseload_twitter.csv'.format(country), index=False)
            return (report_monthly_df, monthly_df)
        else:
            return None

    caseload = get_caseload(reported)
    print('twitter scraped')
    return caseload


if __name__ == '__main__':
    print(find_cases('Portugal'))